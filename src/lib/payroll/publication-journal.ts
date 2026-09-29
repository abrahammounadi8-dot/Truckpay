/** Internal PostgreSQL journal. Reservations consume their cohort permanently, even
 * if invalidated; never delete history to retry. This module cannot publish data.
 */
import { randomUUID } from "node:crypto";
import { reviewStillMatches, type PublicationInput, type PublicationReview, type ReleaseHistory } from "./publication-policy";

type QueryResult = { rows: Record<string, unknown>[] };
export type ReviewConnection = { query: (sql: string, params?: unknown[]) => Promise<QueryResult>; release: () => void };
export type ReviewPool = { connect: () => Promise<ReviewConnection> };
type FreshInput = Omit<PublicationInput, "history">;

export async function historyInConnection(connection: ReviewConnection): Promise<ReleaseHistory[]> {
  const result = await connection.query(`SELECT r.employer_slug, r.period_start::text, r.period_end::text,
    COALESCE(array_agg(p.person_key) FILTER (WHERE p.person_key IS NOT NULL), ARRAY[]::text[]) AS people
    FROM truckpay_publication_reviews r LEFT JOIN truckpay_publication_review_people p ON p.review_id = r.id
    GROUP BY r.id ORDER BY r.id`);
  return result.rows.map(r => ({ employerSlug: String(r.employer_slug),
    period: { start: String(r.period_start), end: String(r.period_end) }, personKeys: r.people as string[] }));
}

export async function readPublicationHistory(pool: ReviewPool): Promise<ReleaseHistory[]> {
  const connection = await pool.connect();
  try { return await historyInConnection(connection); } finally { connection.release(); }
}

/** Operator-only integration seam, deliberately not wired to HTTP or cron.
 * loadFresh must read current documents and trusted person attestations using this
 * connection. It must not return a cached preparation snapshot or user-supplied IDs.
 */
export async function reservePublicationReview(pool: ReviewPool, review: PublicationReview,
  reviewerReference: string, loadFresh: (connection: ReviewConnection) => Promise<FreshInput>): Promise<string> {
  if (!reviewerReference.trim()) throw new Error("A disclosure review reference is required.");
  const candidate = structuredClone(review);
  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    // Serialize reservations and block consent/payroll writes while revalidating.
    await connection.query("SELECT pg_advisory_xact_lock(847293)");
    await connection.query("LOCK TABLE truckpay_documents IN SHARE MODE");
    await connection.query("LOCK TABLE truckpay_publication_identities IN SHARE MODE");
    const history = await historyInConnection(connection);
    const current = { ...await loadFresh(connection), history };
    if (!reviewStillMatches(candidate, current)) throw new Error("Disclosure review is stale or blocked; prepare a new review.");
    const id = randomUUID();
    await connection.query(`INSERT INTO truckpay_publication_reviews
      (id, employer_slug, period_start, period_end, fingerprint, proposal, reviewer_reference)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`, [id, current.employerSlug, current.period.start, current.period.end,
      candidate.audit.fingerprint, JSON.stringify(candidate.proposal), reviewerReference]);
    for (const key of candidate.audit.personKeys) {
      await connection.query("INSERT INTO truckpay_publication_review_people (person_key, review_id) VALUES ($1,$2)", [key, id]);
    }
    await connection.query("COMMIT");
    return id;
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { connection.release(); }
}

/** Invalidates an entire reservation without changing its figures or removing its
 * participation history. A future serving path must never expose reservations.
 */
export async function invalidatePublicationReview(pool: ReviewPool, personKey: string): Promise<void> {
  const connection = await pool.connect();
  try {
    await connection.query(`UPDATE truckpay_publication_reviews SET invalidated_at = COALESCE(invalidated_at, now())
      WHERE id IN (SELECT review_id FROM truckpay_publication_review_people WHERE person_key = $1)`, [personKey]);
  } finally { connection.release(); }
}
