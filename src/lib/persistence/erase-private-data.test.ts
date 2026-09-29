import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { erasePrivateData } from "./erase-private-data";

const alice = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bob = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

for (const verified of [true, false]) {
  test(`erasure revokes pending links and preserves another owner (${verified ? "account" : "anonymous"})`, async () => {
    const db = new PGlite();
    const adapter = {
      async query(sql: string, params?: unknown[]) {
        const result = await db.query<Record<string, unknown>>(sql, params);
        return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
      },
    };
    try {
      for (const name of ["001-documents", "002-email-accounts"]) {
        await db.exec(await readFile(`src/lib/persistence/migrations/${name}.sql`, "utf8"));
      }
      await db.query(`INSERT INTO truckpay_documents (kind,id,user_id,content_hash,payload) VALUES
        ('payslip','alice-slip',$1,'alice-hash','{}'), ('profile','alice-profile',$1,NULL,'{}'),
        ('payslip','bob-slip',$2,'bob-hash','{}')`, [alice, bob]);
      await db.query(`INSERT INTO truckpay_accounts (user_id,email) VALUES ($1,'bob@example.com')`, [bob]);
      if (verified) {
        await db.query(`INSERT INTO truckpay_accounts (user_id,email) VALUES ($1,'alice@example.com')`, [alice]);
        await db.query(`INSERT INTO truckpay_account_sessions (token_hash,user_id,expires_at) VALUES
          ('alice-session-1',$1,now()+interval '1 day'), ('alice-session-2',$1,now()+interval '1 day')`, [alice]);
        // A recovery request from a second device must also be revoked.
        await db.query(`INSERT INTO truckpay_login_links (token_hash,email,proposed_user_id,expires_at)
          VALUES ('alice-recovery','alice@example.com',$1,now()+interval '15 minutes')`, [bob]);
      }
      await db.query(`INSERT INTO truckpay_account_sessions (token_hash,user_id,expires_at)
        VALUES ('bob-session',$1,now()+interval '1 day')`, [bob]);
      await db.query(`INSERT INTO truckpay_login_links (token_hash,email,proposed_user_id,expires_at) VALUES
        ('alice-link','alice@example.com',$1,now()+interval '15 minutes'),
        ('bob-link','bob@example.com',$2,now()+interval '15 minutes')`, [alice,bob]);

      await db.exec("BEGIN");
      assert.equal(await erasePrivateData(adapter, alice, verified), 1);
      await db.exec("COMMIT");
      assert.deepEqual((await db.query("SELECT id FROM truckpay_documents")).rows, [{ id: "bob-slip" }]);
      assert.deepEqual((await db.query("SELECT email FROM truckpay_accounts")).rows, [{ email: "bob@example.com" }]);
      assert.deepEqual((await db.query("SELECT token_hash FROM truckpay_account_sessions")).rows, [{ token_hash: "bob-session" }]);
      assert.deepEqual((await db.query("SELECT token_hash FROM truckpay_login_links")).rows, [{ token_hash: "bob-link" }]);
      assert.equal(await erasePrivateData(adapter, alice, verified), 0);
    } finally { await db.close(); }
  });
}
