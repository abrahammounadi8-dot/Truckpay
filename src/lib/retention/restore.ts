import type { Pool } from "pg";

export type DeletionRecord = { user_id: string; deleted_at: string };
/** Maintenance-only: run on an isolated restored copy before reconnecting users or mail. */
export async function reconcileRestoredCopy(pool: Pool, deletions: DeletionRecord[]) {
  for (const item of deletions) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.user_id)
      || !Number.isFinite(Date.parse(item.deleted_at))) throw new Error("Invalid external deletion ledger.");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(847293)");
    for (const item of deletions) {
      const id = item.user_id;
      await client.query('DELETE FROM truckpay_documents WHERE user_id::text=$1', [id]);
      await client.query('DELETE FROM "session" WHERE "userId"=$1', [id]);
      await client.query('DELETE FROM account WHERE "userId"=$1', [id]);
      await client.query('DELETE FROM "user" WHERE id=$1', [id]);
      await client.query('DELETE FROM truckpay_retention WHERE user_id=$1', [id]);
      await client.query(`INSERT INTO truckpay_retention_deletions(user_id,deleted_at) VALUES($1,$2)
        ON CONFLICT(user_id) DO UPDATE SET deleted_at=GREATEST(truckpay_retention_deletions.deleted_at,EXCLUDED.deleted_at)`, [id,item.deleted_at]);
    }
    // Restored cookies, sign-in links, withdrawals and activity cannot be trusted as current.
    await client.query('DELETE FROM "session"');
    await client.query('DELETE FROM verification');
    await client.query(`UPDATE truckpay_documents SET payload=jsonb_set(payload,'{statisticsSharing}',
      '{"enabled":false,"noticeVersion":"restore-reconfirmation-required"}'::jsonb),updated_at=now() WHERE kind='profile'`);
    await client.query(`DELETE FROM truckpay_retention`);
    await client.query(`INSERT INTO truckpay_retention(user_id) SELECT id FROM "user"`);
    await client.query("COMMIT");
    return { reconciledDeletions: deletions.length, sessionsInvalidated: true, statisticsRequireNewPermission: true };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
