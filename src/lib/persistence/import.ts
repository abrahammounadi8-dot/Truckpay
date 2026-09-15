import { payslipContentHash } from "@/lib/payroll/fingerprint";
import type { Payslip, EmploymentProfile } from "@/lib/payroll/types";
import type { Queryable, DocumentKind } from "./documents";

type ImportRecord = { kind: DocumentKind; id: string; userId: string; hash: string | null; payload: Payslip | EmploymentProfile };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function prepareImport(payslips: unknown, profiles: unknown): ImportRecord[] {
  const slips = Array.isArray(payslips) ? payslips : (payslips as { payslips?: unknown })?.payslips;
  const people = (profiles as { profiles?: unknown })?.profiles;
  if (!Array.isArray(slips) || !Array.isArray(people)) throw new Error("Expected payslips and profiles arrays.");
  const records: ImportRecord[] = [];
  for (const value of slips) {
    const slip = value as Payslip;
    if (!slip || !uuid.test(slip.userId) || typeof slip.id !== "string" || !slip.id ||
        typeof slip.paymentDate !== "string" || !Array.isArray(slip.deductions) || !Array.isArray(slip.allowances)) {
      throw new Error("Invalid payslip record. No records were imported.");
    }
    const contentHash = slip.contentHash || payslipContentHash(slip);
    records.push({ kind: "payslip", id: slip.id, userId: slip.userId, hash: contentHash, payload: { ...slip, contentHash } });
  }
  for (const value of people) {
    const profile = value as EmploymentProfile;
    if (!profile || !uuid.test(profile.userId) || typeof profile.jobType !== "string" || typeof profile.updatedAt !== "string") {
      throw new Error("Invalid employment profile. No records were imported.");
    }
    records.push({ kind: "profile", id: profile.userId, userId: profile.userId, hash: null, payload: profile });
  }
  return records;
}

/** Caller owns the transaction. Re-runs skip identical rows and reject conflicting data. */
export async function importRecords(db: Queryable, records: ImportRecord[]) {
  let inserted = 0;
  let unchanged = 0;
  for (const record of records) {
    const payload = JSON.stringify(record.payload);
    const result = await db.query(
      "INSERT INTO truckpay_documents (kind, id, user_id, content_hash, payload) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT DO NOTHING RETURNING id",
      [record.kind, record.id, record.userId, record.hash, payload],
    );
    if (result.rows.length) { inserted++; continue; }
    const existing = await db.query(
      "SELECT id FROM truckpay_documents WHERE kind = $1 AND id = $2 AND user_id = $3 AND payload = $4::jsonb",
      [record.kind, record.id, record.userId, payload],
    );
    if (!existing.rows.length) throw new Error("Import conflicts with an existing record. Transaction rolled back.");
    unchanged++;
  }
  return { inserted, unchanged };
}
