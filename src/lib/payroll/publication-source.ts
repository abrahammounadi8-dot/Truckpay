/** Operator-only database adapter. Never import into routes or components. */
import { fleet } from "../data";
import { preparePublicationReview, type PublicationInput, type PublicationPeriod, type PublicationReview } from "./publication-policy";
import { historyInConnection, reservePublicationReview, type ReviewConnection, type ReviewPool } from "./publication-journal";
import type { EmploymentProfile, Payslip } from "./types";

export type PublicationRequest = { employerSlug: string; period: PublicationPeriod; frozenAt: string };

/** Called under journal document + identity locks at reservation time. Row ownership
 * is checked against payload ownership; no user-controlled person key is accepted.
 */
export async function loadPublicationSource(connection: ReviewConnection, request: PublicationRequest): Promise<Omit<PublicationInput, "history">> {
  if (!fleet.some(c => c.slug === request.employerSlug)) throw new Error("Employer is not in the public catalogue.");
  const identities = await connection.query(`SELECT user_id::text, person_key::text FROM truckpay_publication_identities
    WHERE revoked_at IS NULL AND reviewed_at <= $1::timestamptz ORDER BY user_id`, [request.frozenAt]);
  const users = identities.rows.map(r => String(r.user_id));
  const result = await connection.query(`SELECT kind, user_id::text, payload FROM truckpay_documents
    WHERE user_id = ANY($1::uuid[]) AND (kind = 'profile' OR payload->>'employerSlug' = $2)
    ORDER BY kind, id`, [users, request.employerSlug]);
  const profiles: EmploymentProfile[] = [], payslips: Payslip[] = [];
  for (const row of result.rows) {
    const payload = row.payload as EmploymentProfile | Payslip;
    if (!payload || payload.userId !== row.user_id) throw new Error("Stored document ownership mismatch.");
    if (row.kind === "profile") profiles.push(payload as EmploymentProfile);
    else if (row.kind === "payslip") payslips.push(payload as Payslip);
  }
  return { ...request, period: { ...request.period }, publicEmployerSlugs: fleet.map(c => c.slug), profiles, payslips,
    reviewedPeople: identities.rows.map(r => ({ userId: String(r.user_id), personKey: String(r.person_key) })) };
}

export async function prepareStoredPublicationReview(pool: ReviewPool, request: PublicationRequest): Promise<PublicationReview> {
  const connection = await pool.connect();
  try {
    const source = await loadPublicationSource(connection, request);
    // Preparation is advisory; reservation re-reads everything under locks.
    return preparePublicationReview({ ...source, history: await historyInConnection(connection) });
  } finally { connection.release(); }
}

export function reserveStoredPublicationReview(pool: ReviewPool, request: PublicationRequest, review: PublicationReview, reviewerReference: string) {
  const frozenRequest = structuredClone(request);
  return reservePublicationReview(pool, review, reviewerReference, connection => loadPublicationSource(connection, frozenRequest));
}
