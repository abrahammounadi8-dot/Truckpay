/** Operator-only identity review operations. Never import into routes or components. */
import { randomUUID } from "node:crypto";
import type { ReviewPool } from "./publication-journal";

export type IdentityReviewAction = "approve" | "link" | "conflict" | "unverified" | "revoke";
export type IdentityReviewRequest = {
  userId: string;
  action: IdentityReviewAction;
  reviewerReference: string;
  personKey?: string;
  reason?: string;
};

export type IdentityReviewResult = {
  userId: string;
  status: "approved" | "conflict" | "unverified";
  personKey: string | null;
  revokedAt: string | null;
};

function required(value: string | undefined, label: string): string {
  const clean = value?.trim();
  if (!clean) throw new Error(`${label} is required.`);
  return clean;
}

/** Server-side maintenance operation. Database credentials are the authentication
 * boundary; callers must additionally be restricted to the authorised operator.
 * It shares the publication advisory lock so identity changes cannot race a
 * reservation.
 */
export async function reviewPublicationIdentity(pool: ReviewPool, request: IdentityReviewRequest): Promise<IdentityReviewResult> {
  const userId = required(request.userId, "userId");
  const reviewerReference = required(request.reviewerReference, "reviewerReference");
  const reason = request.reason?.trim() || null;
  if (["conflict", "unverified", "revoke"].includes(request.action) && !reason) {
    throw new Error(`reason is required for ${request.action}.`);
  }
  if (request.action === "link" && !request.personKey?.trim()) throw new Error("personKey is required for link.");

  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    await connection.query("SELECT pg_advisory_xact_lock(847293)");

    const current = await connection.query(
      "SELECT person_key::text, review_status, revoked_at::text FROM truckpay_publication_identities WHERE user_id=$1::uuid FOR UPDATE",
      [userId],
    );
    const existing = current.rows[0];

    let status: IdentityReviewResult["status"];
    let personKey: string | null;
    let revokedAt: string | null = null;

    if (request.action === "revoke") {
      if (!existing) throw new Error("Cannot revoke an identity that has not been reviewed.");
      status = String(existing.review_status) as IdentityReviewResult["status"];
      personKey = existing.person_key ? String(existing.person_key) : null;
      const updated = await connection.query(
        `UPDATE truckpay_publication_identities
         SET revoked_at=now(), revocation_reason=$2, updated_at=now(), reviewer_reference=$3
         WHERE user_id=$1::uuid
         RETURNING revoked_at::text`,
        [userId, reason, reviewerReference],
      );
      revokedAt = String(updated.rows[0].revoked_at);
    } else {
      status = request.action === "conflict" ? "conflict" : request.action === "unverified" ? "unverified" : "approved";
      if (request.action === "link") personKey = required(request.personKey, "personKey");
      else if (request.action === "approve") personKey = existing?.person_key ? String(existing.person_key) : randomUUID();
      else personKey = null;

      await connection.query(
        `INSERT INTO truckpay_publication_identities
          (user_id, person_key, reviewer_reference, reviewed_at, revoked_at, review_status, revocation_reason, updated_at)
         VALUES ($1::uuid,$2::uuid,$3,now(),NULL,$4,NULL,now())
         ON CONFLICT (user_id) DO UPDATE SET
          person_key=EXCLUDED.person_key,
          reviewer_reference=EXCLUDED.reviewer_reference,
          reviewed_at=now(),
          revoked_at=NULL,
          review_status=EXCLUDED.review_status,
          revocation_reason=NULL,
          updated_at=now()`,
        [userId, personKey, reviewerReference, status],
      );
    }

    await connection.query(
      `INSERT INTO truckpay_publication_identity_audit
       (event_id,user_id,action,person_key,reviewer_reference,reason)
       VALUES ($1::uuid,$2::uuid,$3,$4::uuid,$5,$6)`,
      [randomUUID(), userId, request.action, personKey, reviewerReference, reason],
    );
    await connection.query("COMMIT");
    return { userId, status, personKey, revokedAt };
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}
