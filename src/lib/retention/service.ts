import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { DeletionLedger } from "./external-ledger";

export type RetentionMail = { send(email: string, noticeId: string): Promise<string>; delivered(providerId: string): Promise<boolean> };
export type RetentionMode = "dry-run" | "notify" | "delete";
type Row = { user_id: string; email: string; state: string; notice_id: string | null; provider_id: string | null; delivered_at: Date | null };

async function locked<T>(pool: Pool, id: string, run: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

/** Missing users cannot be resurrected by a stale session. Activity cancels notices. */
export async function recordActivity(pool: Pool, id: string): Promise<boolean> {
  return locked(pool, id, async client => {
    const user = await client.query('SELECT id FROM "user" WHERE id=$1', [id]);
    if (!user.rowCount) return false;
    await client.query(`INSERT INTO truckpay_retention(user_id) VALUES($1)
      ON CONFLICT(user_id) DO UPDATE SET last_active_at=now(), state='active',
      notice_id=NULL, notice_started_at=NULL, provider_id=NULL, delivered_at=NULL`, [id]);
    return true;
  });
}

/** Bounded runs. Provider/network errors never make an account eligible for deletion. */
export async function runRetention(pool: Pool, mail: RetentionMail, mode: RetentionMode = "dry-run", ledger?: DeletionLedger) {
  const counts = { eligible: 0, notices: 0, delivered: 0, deleted: 0, blocked: 0, errors: 0 };
  if (mode === "delete") {
    if (!ledger) throw new Error("Independent deletion ledger is required.");
    await ledger.assertReady();
  }
  if (mode !== "dry-run") {
    // Legacy accounts start a full 24-month clock, never from an inferred old date.
    await pool.query(`INSERT INTO truckpay_retention(user_id) SELECT id FROM "user" ON CONFLICT DO NOTHING`);
  }
  const candidates = await pool.query<{ user_id: string }>(`SELECT r.user_id FROM truckpay_retention r
    JOIN "user" u ON u.id::text=r.user_id WHERE r.last_active_at <= now()-interval '24 months'
    AND NOT EXISTS(SELECT 1 FROM "session" s WHERE s."userId"=u.id AND s."expiresAt">now())
    ORDER BY r.checked_at NULLS FIRST,r.user_id LIMIT 10`);
  counts.eligible = candidates.rows.length;
  if (mode === "dry-run") return counts;
  for (const { user_id: id } of candidates.rows) {
    try {
      const action = await locked(pool, id, async client => {
        const result = await client.query<Row>(`SELECT r.*,u.email FROM truckpay_retention r JOIN "user" u ON u.id::text=r.user_id
          WHERE r.user_id=$1 AND r.last_active_at<=now()-interval '24 months'
          AND NOT EXISTS(SELECT 1 FROM "session" s WHERE s."userId"=u.id AND s."expiresAt">now())`, [id]);
        const row = result.rows[0];
        if (!row) return null;
        await client.query("UPDATE truckpay_retention SET checked_at=now() WHERE user_id=$1", [id]);
        if (row.state === "active") {
          const notice = randomUUID();
          // Commit reservation BEFORE sending; an ambiguous crash cannot cause duplicates.
          await client.query("UPDATE truckpay_retention SET state='sending',notice_id=$2,notice_started_at=now() WHERE user_id=$1", [id, notice]);
          return { ...row, state: "send", notice_id: notice };
        }
        if (row.state === "delivered" && mode === "delete") {
          const due = await client.query(`SELECT 1 FROM truckpay_retention WHERE user_id=$1 AND delivered_at<=now()-interval '30 days'`, [id]);
          if (due.rowCount) {
            // If there is a fresh pending sign-in link, defer deletion until it expires.
            const pending = await client.query(`SELECT value FROM verification WHERE "expiresAt">now()`);
            if (pending.rows.some(v => { try { return JSON.parse(v.value).email === row.email; } catch { return true; } })) return null;
            const expired = await client.query('SELECT id,value FROM verification WHERE "expiresAt"<=now()');
            for (const verification of expired.rows) {
              try {
                if (JSON.parse(verification.value).email === row.email) await client.query('DELETE FROM verification WHERE id=$1', [verification.id]);
              } catch { /* Unrelated opaque verification records are not assigned to this user. */ }
            }
            await client.query('DELETE FROM truckpay_documents WHERE user_id::text=$1', [id]);
            await client.query('DELETE FROM "session" WHERE "userId"=$1', [id]);
            await client.query('DELETE FROM account WHERE "userId"=$1', [id]);
            await client.query('DELETE FROM "user" WHERE id=$1', [id]);
            const deletion = await client.query<{deleted_at: Date}>('INSERT INTO truckpay_retention_deletions(user_id) VALUES($1) RETURNING deleted_at', [id]);
            await client.query('DELETE FROM truckpay_retention WHERE user_id=$1', [id]);
            // External reservation must be durable BEFORE the local commit. An ambiguous
            // commit leaves it prepared and blocks restoration, never silently resurrects data.
            await ledger!.prepare(id);
            return { ...row, state: "deleted", deleted_at: new Date(deletion.rows[0].deleted_at).toISOString() };
          }
        }
        return row;
      });
      if (!action) continue;
      if (action.state === "deleted" && "deleted_at" in action) {
        counts.deleted++;
        await ledger!.complete({ user_id: id, deleted_at: action.deleted_at as string });
        continue;
      }
      if (action.state === "send") {
        try {
          const provider = await mail.send(action.email, action.notice_id!);
          const saved = await pool.query("UPDATE truckpay_retention SET state='sent',provider_id=$3 WHERE user_id=$1 AND notice_id=$2 AND state='sending'", [id, action.notice_id, provider]);
          counts.notices += saved.rowCount ?? 0;
        } catch {
          await pool.query("UPDATE truckpay_retention SET state='blocked' WHERE user_id=$1 AND notice_id=$2 AND state='sending'", [id, action.notice_id]);
          counts.errors++;
        }
      } else if (action.state === "sent" && action.provider_id) {
        if (await mail.delivered(action.provider_id)) {
          const saved = await pool.query("UPDATE truckpay_retention SET state='delivered',delivered_at=now() WHERE user_id=$1 AND notice_id=$2 AND state='sent'", [id, action.notice_id]);
          counts.delivered += saved.rowCount ?? 0;
        } else counts.blocked++;
      } else if (["sending", "blocked"].includes(action.state)) counts.blocked++;
    } catch { counts.errors++; }
  }
  return counts;
}
