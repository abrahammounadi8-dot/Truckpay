import { publicationFixture } from "./publication-fixture";
import type { ReviewConnection } from "../publication-journal";

export const publicationTestRequest = {
  employerSlug: "hannon", period: { start: "2025-01-01", end: "2025-03-31" }, frozenAt: "2025-04-15T00:00:00.000Z",
};
export async function seedPublicationDatabase(connection: Pick<ReviewConnection, "query">) {
  const input = publicationFixture(11);
  const users = input.reviewedPeople.map((_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
  for (const [i, person] of input.reviewedPeople.entries()) {
    const userId = users[i], personKey = `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const source = input.profiles[i];
    const profile = { ...source, userId, employerSlug: "hannon", employmentStarts: { hannon: source.employmentStarts!["synthetic-firm"] } };
    await connection.query("INSERT INTO truckpay_documents(kind,id,user_id,payload) VALUES('profile',$1,$2::uuid,$3::jsonb)", [userId, userId, JSON.stringify(profile)]);
    for (const slip of input.payslips.filter(s => s.userId === person.userId)) {
      const stored = { ...slip, userId, employerSlug: "hannon", employerName: "Hannon Logistics" };
      await connection.query("INSERT INTO truckpay_documents(kind,id,user_id,content_hash,payload) VALUES('payslip',$1,$2::uuid,$3,$4::jsonb)", [stored.id, userId, stored.contentHash, JSON.stringify(stored)]);
    }
    await connection.query("INSERT INTO truckpay_publication_identities(user_id,person_key,reviewer_reference,reviewed_at) VALUES($1::uuid,$2::uuid,'synthetic-review','2025-04-01T00:00:00Z')", [userId, personKey]);
  }
  return users;
}
