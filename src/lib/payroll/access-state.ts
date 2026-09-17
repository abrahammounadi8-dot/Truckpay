import { analyseLatestSet } from "./analysis";
import type { Payslip, EmploymentProfile } from "./types";

export function comparisonAccess(slips: Payslip[], profile: EmploymentProfile | null = null) {
  const unique = [...new Map(slips.map(s => [s.contentHash || s.id, s])).values()];
  const analysis = analyseLatestSet(unique, profile);
  return { unlocked: analysis.status === "verified", have: analysis.have, required: analysis.required, needsDetails: analysis.status === "incomplete" };
}
