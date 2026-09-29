import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("email account migration preserves legacy payslips and revokes sessions on deletion", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  try {
    await db.exec(await readFile("src/lib/persistence/migrations/001-documents.sql", "utf8"));
    await db.query("INSERT INTO truckpay_documents (kind, id, user_id, content_hash, payload) VALUES ('payslip','legacy',$1,'hash','{}')", [userId]);
    const migration = await readFile("src/lib/persistence/migrations/002-email-accounts.sql", "utf8");
    await db.exec(migration);
    await db.exec(migration);
    await db.query("INSERT INTO truckpay_accounts (user_id, email) VALUES ($1, 'driver@example.com')", [userId]);
    const old = await db.query<{ user_id: string }>("SELECT user_id FROM truckpay_documents WHERE id = 'legacy'");
    assert.equal(old.rows[0].user_id, userId);
    await assert.rejects(db.query("INSERT INTO truckpay_accounts (user_id, email) VALUES (gen_random_uuid(), 'driver@example.com')"), /unique|duplicate/i);
    await db.query("INSERT INTO truckpay_account_sessions (token_hash, user_id, expires_at) VALUES ('hashed', $1, now() + interval '30 days')", [userId]);
    await db.query("DELETE FROM truckpay_accounts WHERE user_id = $1", [userId]);
    assert.equal((await db.query("SELECT * FROM truckpay_account_sessions")).rows.length, 0);
    assert.equal((await db.query("SELECT * FROM truckpay_documents WHERE id = 'legacy'")).rows.length, 1);
  } finally { await db.close(); }
});
