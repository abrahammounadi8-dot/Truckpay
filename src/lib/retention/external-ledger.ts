import { Pool } from "pg";
import type { DeletionRecord } from "./restore";

export interface DeletionLedger {
  assertReady(): Promise<void>;
  prepare(userId: string): Promise<void>;
  complete(record: DeletionRecord): Promise<void>;
}

// Provision in an independent database, never in the application's migrations.
export const externalLedgerSchema = `CREATE TABLE IF NOT EXISTS retention_external_deletions (
  user_id uuid PRIMARY KEY,
  state text NOT NULL CHECK (state IN ('prepared','committed')),
  prepared_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK ((state='committed') = (deleted_at IS NOT NULL))
)`;

export function postgresDeletionLedger(pool: Pool): DeletionLedger & { readForRestore(): Promise<DeletionRecord[]> } {
  return {
    async assertReady() {
      const pending = await pool.query("SELECT 1 FROM retention_external_deletions WHERE state='prepared' LIMIT 1");
      if (pending.rows.length) throw new Error("Unresolved deletion requires reconciliation.");
    },
    async prepare(userId) {
      await pool.query("INSERT INTO retention_external_deletions(user_id,state) VALUES($1::uuid,'prepared') ON CONFLICT(user_id) DO NOTHING", [userId]);
    },
    async complete(record) {
      const result = await pool.query(`UPDATE retention_external_deletions SET state='committed',deleted_at=$2::timestamptz
        WHERE user_id=$1::uuid AND (state='prepared' OR deleted_at=$2::timestamptz) RETURNING user_id`, [record.user_id, record.deleted_at]);
      if (!result.rows.length) throw new Error("Missing or inconsistent deletion reservation.");
    },
    async readForRestore() {
      // Run only after the source worker is stopped; do not restore while deletions are running.
      const result = await pool.query<{ user_id: string; state: string; deleted_at: Date }>("SELECT user_id,state,deleted_at FROM retention_external_deletions ORDER BY user_id");
      if (result.rows.some(row => row.state !== "committed")) throw new Error("Restoration blocked by unresolved deletion.");
      return result.rows.map(row => ({ user_id: row.user_id, deleted_at: new Date(row.deleted_at).toISOString() }));
    },
  };
}

let externalPool: Pool | undefined;
export function configuredDeletionLedger() {
  const external = process.env.MTP_RETENTION_LEDGER_DATABASE_URL;
  const primary = process.env.DATABASE_URL;
  if (!external || !primary) throw new Error("Independent deletion ledger is required.");
  const ledgerUrl = new URL(external), primaryUrl = new URL(primary);
  const host = (url: URL) => url.hostname.replace(/-pooler(?=\.)/, "");
  if (host(ledgerUrl) === host(primaryUrl)) throw new Error("Deletion ledger must use an independent database host.");
  if (!externalPool) {
    externalPool = new Pool({ connectionString: external, max: 2, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000, query_timeout: 10000 });
    externalPool.on("error", () => console.error("Deletion ledger connection interrupted."));
  }
  return postgresDeletionLedger(externalPool);
}
