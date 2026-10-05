import { it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { reviewPublicationIdentity, type IdentityReviewAction } from "./publication-identities";
import type { ReviewPool } from "./publication-journal";

async function fixture() {
  const db = new PGlite();
  for (const name of ["001-documents.sql","003-publication-review.sql","004-publication-source.sql","005-publication-identity-controls.sql"]) {
    await db.exec(await readFile(new URL(`../persistence/migrations/${name}`, import.meta.url), "utf8"));
  }
  const pool: ReviewPool = { connect: async () => ({
    query: async (sql, params) => db.query<Record<string, unknown>>(sql, params),
    release: () => {},
  }) };
  return { db, pool };
}

it("reuses a stable person key and links another account to the same person", async () => {
  const { db, pool } = await fixture();
  try {
    const first = await reviewPublicationIdentity(pool, {
      userId: "10000000-0000-4000-8000-000000000001",
      action: "approve",
      reviewerReference: "manual-review-a",
    });
    assert.equal(first.status, "approved");
    assert.ok(first.personKey);

    const again = await reviewPublicationIdentity(pool, {
      userId: first.userId,
      action: "approve",
      reviewerReference: "manual-review-b",
    });
    assert.equal(again.personKey, first.personKey, "approval must not rotate the stable person key");

    const linked = await reviewPublicationIdentity(pool, {
      userId: "10000000-0000-4000-8000-000000000002",
      action: "link",
      personKey: first.personKey!,
      reviewerReference: "manual-duplicate-check",
    });
    assert.equal(linked.personKey, first.personKey);
    const distinct = await db.query<{ n: number }>(
      "SELECT count(DISTINCT person_key)::int AS n FROM truckpay_publication_identities WHERE review_status='approved' AND revoked_at IS NULL"
    );
    assert.equal(distinct.rows[0].n, 1);
    const audit = await db.query("SELECT action FROM truckpay_publication_identity_audit ORDER BY created_at,event_id");
    assert.equal(audit.rows.length, 3);
  } finally { await db.close(); }
});

it("fails closed for unverified/conflict states and records revocation", async () => {
  const { db, pool } = await fixture();
  try {
    const userId = "20000000-0000-4000-8000-000000000001";
    await reviewPublicationIdentity(pool, {
      userId,
      action: "unverified",
      reviewerReference: "manual-review",
      reason: "insufficient evidence",
    });
    let row = (await db.query<{ review_status: string; person_key: string | null; revoked_at: string | null }>(
      "SELECT review_status,person_key::text,revoked_at::text FROM truckpay_publication_identities WHERE user_id=$1::uuid",[userId]
    )).rows[0];
    assert.equal(row.review_status, "unverified");
    assert.equal(row.person_key, null);

    const approved = await reviewPublicationIdentity(pool, {
      userId,
      action: "approve",
      reviewerReference: "manual-review-approved",
    });
    assert.ok(approved.personKey);

    const revoked = await reviewPublicationIdentity(pool, {
      userId,
      action: "revoke",
      reviewerReference: "manual-revoke",
      reason: "operator correction",
    });
    assert.ok(revoked.revokedAt);
    row = (await db.query(
      "SELECT review_status,person_key::text,revoked_at::text FROM truckpay_publication_identities WHERE user_id=$1::uuid",[userId]
    )).rows[0] as typeof row;
    assert.equal(row.review_status, "approved");
    assert.ok(row.revoked_at);
    await assert.rejects(
      reviewPublicationIdentity(pool, {
        userId: "20000000-0000-4000-8000-000000000099",
        action: "conflict",
        reviewerReference: "manual-review",
      }),
      /reason is required/,
    );
  } finally { await db.close(); }
});

it("preserves a reviewed person key through exclusion and subsequent approval", async () => {
  const { db, pool } = await fixture();
  try {
    const userId = "30000000-0000-4000-8000-000000000001";
    const request = { userId, reviewerReference: "manual-review" };
    const approved = await reviewPublicationIdentity(pool, { ...request, action: "approve" });
    for (const action of ["conflict", "unverified"] as const) {
      const excluded = await reviewPublicationIdentity(pool, {
        ...request, action, reason: "review requires clarification",
      });
      assert.equal(excluded.status, action);
      assert.equal(excluded.personKey, approved.personKey);
      const eligible = await db.query(
        "SELECT person_key FROM truckpay_publication_identities WHERE review_status='approved' AND revoked_at IS NULL",
      );
      assert.equal(eligible.rows.length, 0);
      const restored = await reviewPublicationIdentity(pool, { ...request, action: "approve" });
      assert.equal(restored.personKey, approved.personKey, "exclusion must not allow a new person key");
    }
  } finally { await db.close(); }
});

it("rejects unknown runtime actions before opening a database connection", async () => {
  const pool: ReviewPool = { connect: async () => { throw new Error("must not connect"); } };
  await assert.rejects(reviewPublicationIdentity(pool, {
    userId: "30000000-0000-4000-8000-000000000001",
    action: "unexpected" as IdentityReviewAction,
    reviewerReference: "manual-review",
  }), /Valid identity review action is required/);
});
