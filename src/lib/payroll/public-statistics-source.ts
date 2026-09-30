import "server-only";
import { database, usesDatabase } from "../persistence/database";
import { listAllPayslips } from "./store";
import { listProfiles } from "./profile-store";
import { hydratePayslip } from "./process";
import type { EmploymentProfile, Payslip } from "./types";

/** A single database statement keeps consent and payroll in the same snapshot. */
export async function publicStatisticsSource() {
  if (!usesDatabase()) {
    const [payslips, profiles] = await Promise.all([listAllPayslips(), listProfiles()]);
    return { payslips, profiles };
  }
  const result = await database().query("SELECT kind, user_id::text, payload FROM truckpay_documents WHERE kind IN ('profile', 'payslip') ORDER BY id");
  const payslips: Payslip[] = [], profiles: EmploymentProfile[] = [];
  for (const row of result.rows) {
    const payload = row.payload as Payslip | EmploymentProfile;
    if (!payload || payload.userId !== row.user_id) throw new Error("Document ownership mismatch.");
    if (row.kind === "profile") profiles.push(payload as EmploymentProfile);
    else payslips.push(hydratePayslip(payload as Payslip));
  }
  return { payslips, profiles };
}
