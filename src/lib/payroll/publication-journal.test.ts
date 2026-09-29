import { it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { preparePublicationReview } from "./publication-policy";
import { publicationFixture } from "./testing/publication-fixture";
import { invalidatePublicationReview, readPublicationHistory, reservePublicationReview, type ReviewPool } from "./publication-journal";

async function withJournal(run: (db: PGlite, pool: ReviewPool) => Promise<void>) {
  const db = new PGlite();
  try {
    for (const name of ["001-documents.sql", "003-publication-review.sql", "004-publication-source.sql"]) {
      await db.exec(await readFile(new URL(`../persistence/migrations/${name}`, import.meta.url), "utf8"));
    }
    const pool: ReviewPool = { connect: async () => ({ query: async (sql, params) => db.query(sql, params), release: () => {} }) };
    await run(db, pool);
  } finally { await db.close(); }
}

it("persists one immutable reservation and refuses a second review for its period", async () => {
  await withJournal(async (db, pool) => {
    const input = publicationFixture(), review = preparePublicationReview(input);
    const id = await reservePublicationReview(pool, review, "synthetic-review-001", async () => {
      // Caller-owned objects can change while awaiting I/O; journal uses its own copy.
      review.audit.personKeys = [];
      return input;
    });
    assert.equal((await db.query("SELECT id FROM truckpay_publication_reviews")).rows.length, 1);
    assert.equal((await db.query("SELECT person_key FROM truckpay_publication_review_people")).rows.length, 10);
    assert.equal((await readPublicationHistory(pool))[0].personKeys.length, 10);
    await assert.rejects(reservePublicationReview(pool, preparePublicationReview(input), "synthetic-review-002", async () => input), /stale or blocked/);
    assert.equal((await db.query<{ id: string }>("SELECT id FROM truckpay_publication_reviews")).rows[0].id, id);
  });
});

it("rechecks current permission under a document lock and writes nothing after withdrawal", async () => {
  await withJournal(async (db, pool) => {
    const input = publicationFixture(11), review = preparePublicationReview(input);
    input.profiles[0].statisticsSharing!.enabled = false;
    await assert.rejects(reservePublicationReview(pool, review, "synthetic-review", async () => input), /stale or blocked/);
    assert.equal((await db.query("SELECT id FROM truckpay_publication_reviews")).rows.length, 0);
    assert.equal((await db.query("SELECT person_key FROM truckpay_publication_review_people")).rows.length, 0);
  });
});

it("invalidating a reservation retains its original payload and participation history", async () => {
  await withJournal(async (db, pool) => {
    const input = publicationFixture(), review = preparePublicationReview(input);
    await reservePublicationReview(pool, review, "synthetic-review", async () => input);
    await invalidatePublicationReview(pool, input.reviewedPeople[0].personKey);
    await invalidatePublicationReview(pool, input.reviewedPeople[0].personKey);
    const result = await db.query<{ proposal: unknown; invalidated_at: unknown }>("SELECT proposal, invalidated_at FROM truckpay_publication_reviews");
    assert.deepEqual(result.rows[0].proposal, review.proposal);
    assert.ok(result.rows[0].invalidated_at);
    const history = await readPublicationHistory(pool);
    assert.equal(history.length, 1); assert.equal(history[0].personKeys.length, 10);
    assert.equal(preparePublicationReview({ ...input, history }).status, "blocked");
  });
});

it("a failed journal write rolls back the reservation and all participation keys", async () => {
  await withJournal(async (db, pool) => {
    await db.exec(`CREATE FUNCTION fail_second_key() RETURNS trigger AS $$ BEGIN
      IF (SELECT count(*) FROM truckpay_publication_review_people) >= 1 THEN RAISE EXCEPTION 'synthetic write failure'; END IF;
      RETURN NEW; END; $$ LANGUAGE plpgsql;
      CREATE TRIGGER simulated_failure BEFORE INSERT ON truckpay_publication_review_people
      FOR EACH ROW EXECUTE FUNCTION fail_second_key();`);
    const input = publicationFixture(), review = preparePublicationReview(input);
    await assert.rejects(reservePublicationReview(pool, review, "synthetic-review", async () => input), /synthetic write failure/);
    assert.equal((await db.query("SELECT id FROM truckpay_publication_reviews")).rows.length, 0);
    assert.equal((await db.query("SELECT person_key FROM truckpay_publication_review_people")).rows.length, 0);
  });
});
