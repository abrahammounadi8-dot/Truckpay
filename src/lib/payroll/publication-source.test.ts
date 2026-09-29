import { it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { prepareStoredPublicationReview, reserveStoredPublicationReview } from "./publication-source";
import { readPublicationHistory, type ReviewPool } from "./publication-journal";
import { publicationTestRequest as request, seedPublicationDatabase } from "./testing/publication-database-fixture";

it("loads only stored reviewed identities; withdrawals, edits and profile deletion invalidate reservations atomically", async () => {
  const db = new PGlite();
  const connection = { query: async (sql: string, params?: unknown[]) => db.query<Record<string, unknown>>(sql, params), release: () => {} };
  const pool: ReviewPool = { connect: async () => connection };
  try {
    const migrations = await Promise.all(["001-documents.sql", "003-publication-review.sql", "004-publication-source.sql"].map(n => readFile(new URL(`../persistence/migrations/${n}`, import.meta.url), "utf8")));
    for (const sql of migrations) await db.exec(sql);
    const users = await seedPublicationDatabase(connection);
    const review = await prepareStoredPublicationReview(pool, request);
    assert.equal(review.status, "review_required");
    await reserveStoredPublicationReview(pool, request, review, "synthetic-operator-review");
    const state = async () => (await db.query<{ invalidated_at: unknown }>("SELECT invalidated_at FROM truckpay_publication_reviews")).rows[0].invalidated_at;
    assert.equal(await state(), null);
    await db.exec("BEGIN");
    await db.query("UPDATE truckpay_documents SET payload=jsonb_set(payload,'{statisticsSharing,enabled}','false') WHERE kind='profile' AND user_id=$1::uuid", [users[0]]);
    assert.ok(await state());
    await db.exec("ROLLBACK");
    assert.equal(await state(), null, "withdrawal and invalidation roll back together");
    await db.query("UPDATE truckpay_documents SET payload=jsonb_set(payload,'{netPay}','544') WHERE kind='payslip' AND user_id=$1::uuid", [users[0]]);
    assert.ok(await state());
    const before = (await readPublicationHistory(pool))[0];
    await db.query("DELETE FROM truckpay_documents WHERE kind='profile' AND user_id=$1::uuid", [users[0]]);
    assert.equal((await db.query("SELECT user_id FROM truckpay_publication_identities WHERE user_id=$1::uuid", [users[0]])).rows.length, 0);
    assert.deepEqual((await readPublicationHistory(pool))[0], before, "erasure removes account mapping without making a cohort reusable");
    for (const sql of migrations) await db.exec(sql);
    assert.deepEqual((await readPublicationHistory(pool))[0], before, "migrations are repeatable and preserve reservations");
  } finally { await db.close(); }
});

it("missing, revoked and ambiguous stored person reviews cannot silently become distinct people", async () => {
  const db = new PGlite();
  const connection = { query: async (sql: string, params?: unknown[]) => db.query<Record<string, unknown>>(sql, params), release: () => {} };
  const pool: ReviewPool = { connect: async () => connection };
  try {
    for (const n of ["001-documents.sql", "003-publication-review.sql", "004-publication-source.sql"]) await db.exec(await readFile(new URL(`../persistence/migrations/${n}`, import.meta.url), "utf8"));
    const users = await seedPublicationDatabase(connection);
    await db.query("UPDATE truckpay_publication_identities SET revoked_at=now() WHERE user_id=ANY($1::uuid[])", [users.slice(0, 2)]);
    assert.equal((await prepareStoredPublicationReview(pool, request)).status, "blocked");
    await db.exec("UPDATE truckpay_publication_identities SET revoked_at=NULL,person_key='10000000-0000-4000-8000-000000000001'::uuid");
    assert.equal((await prepareStoredPublicationReview(pool, request)).status, "blocked");
    await db.exec("DELETE FROM truckpay_publication_identities");
    assert.equal((await prepareStoredPublicationReview(pool, request)).status, "blocked");
    await assert.rejects(prepareStoredPublicationReview(pool, { ...request, employerSlug: "private-company" }), /public catalogue/);
  } finally { await db.close(); }
});
