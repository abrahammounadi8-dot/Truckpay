import { prepareImport, importRecords } from "./import";
import { toStoredPayslip } from "@/lib/payroll/parse";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { DocumentRepository, DuplicatePayslipError } from "./documents";

const alice = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bob = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

test("PostgreSQL storage preserves payloads, isolates owners, and enforces duplicate protection", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  try {
    await db.exec(await readFile("src/lib/persistence/migrations/001-documents.sql", "utf8"));
    const repository = new DocumentRepository({
      async query(sql, params) {
        const result = await db.query<Record<string, unknown>>(sql, params);
        return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
      },
    });
    const slip = { id: "one", userId: alice, netPay: null, basicPay: 0, deductions: [], provenance: { note: "á" } };
    await repository.save("payslip", alice, "one", slip, "hash");
    assert.deepEqual(await repository.get("payslip", alice, "one"), slip);
    assert.equal(await repository.get("payslip", bob, "one"), null);
    assert.deepEqual(await repository.list("payslip", bob), []);
    await assert.rejects(repository.save("payslip", bob, "one", { changed: true }, "other"), /ownership/);
    await assert.rejects(repository.save("payslip", alice, "two", slip, "hash"), DuplicatePayslipError);
    await repository.save("payslip", bob, "two", { id: "two" }, "hash");
    assert.equal(await repository.remove("payslip", bob, "one"), 0);
    const attempts = await Promise.allSettled([
      repository.save("payslip", alice, "three", slip, "new-hash"),
      repository.save("payslip", alice, "four", slip, "new-hash"),
    ]);
    assert.equal(attempts.filter(result => result.status === "fulfilled").length, 1);
    await repository.save("profile", alice, alice, { agreedBaseRate: null });
    await repository.save("profile", alice, alice, { agreedBaseRate: 12 });
    assert.deepEqual(await repository.get("profile", alice, alice), { agreedBaseRate: 12 });
    assert.equal(await repository.remove("payslip", alice), 2);
    assert.equal((await repository.list("payslip", bob)).length, 1);
    assert.equal(await repository.remove("profile", alice), 1);
    assert.equal(await repository.get("profile", alice, alice), null);
    // Re-applying the deployment migration must leave existing data intact.
    await db.exec(await readFile("src/lib/persistence/migrations/001-documents.sql", "utf8"));
    assert.equal((await repository.list("payslip", bob)).length, 1);
    await repository.save("profile", bob, bob, { agreedBaseRate: 15 });
    assert.equal(await repository.wipe(alice), 0);
    assert.equal(await repository.wipe(bob), 1);
    assert.deepEqual(await repository.list("profile", bob), []);

    assert.deepEqual(await repository.list("payslip", bob), []);
    const queryable = { async query(sql: string, params?: unknown[]) {
      const result = await db.query<Record<string, unknown>>(sql, params);
      return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
    }};
    const original = toStoredPayslip(alice, { paymentDate: "2026-09-01", grossPay: 700 });
    const records = prepareImport({ payslips: [original] }, { profiles: [] });
    assert.deepEqual(await importRecords(queryable, records), { inserted: 1, unchanged: 0 });
    assert.deepEqual(await importRecords(queryable, records), { inserted: 0, unchanged: 1 });
    const another = toStoredPayslip(alice, { paymentDate: "2026-09-08", grossPay: 800 });
    const conflict = { ...original, grossPay: 701 };
    await db.exec("BEGIN");
    await assert.rejects(importRecords(queryable, prepareImport({ payslips: [another, conflict] }, { profiles: [] })), /conflicts/);
    await db.exec("ROLLBACK");
    assert.equal((await repository.list("payslip", alice)).length, 1);
    assert.throws(() => prepareImport({ payslips: [{ id: "bad", userId: "not-a-uuid" }] }, { profiles: [] }), /Invalid/);
  } finally { await db.close(); }
});

test("database records survive reopening persistent storage", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdtemp, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const root = await mkdtemp(path.join(tmpdir(), "truckpay-db-test-"));
  const directory = path.join(root, "database");
  let db = new PGlite(directory);
  try {
    await db.exec(await readFile("src/lib/persistence/migrations/001-documents.sql", "utf8"));
    await db.query("INSERT INTO truckpay_documents (kind, id, user_id, content_hash, payload) VALUES ($1, $2, $3, $4, $5::jsonb)", ["payslip", "restart", alice, "restart-hash", JSON.stringify({ netPay: null, grossPay: 700 })]);
    await db.close();
    db = new PGlite(directory);
    const result = await db.query<{ payload: { netPay: null; grossPay: number } }>("SELECT payload FROM truckpay_documents WHERE id = $1", ["restart"]);
    assert.deepEqual(result.rows[0].payload, { netPay: null, grossPay: 700 });
  } finally {
    await db.close();
    // Only remove the temporary directory created by this test.
    assert.equal(path.dirname(root), path.resolve(tmpdir()));
    assert.ok(path.basename(root).startsWith("truckpay-db-test-"));
    await rm(root, { recursive: true, force: true });
  }
});

test("storage errors propagate instead of appearing as an empty ledger", async () => {
  const repository = new DocumentRepository({ async query() { throw new Error("unavailable"); } });
  await assert.rejects(repository.list("payslip", alice), /unavailable/);
  await assert.rejects(repository.save("payslip", alice, "test", {}, "hash"), /unavailable/);
});
