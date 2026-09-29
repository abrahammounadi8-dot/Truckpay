import { consecutiveOnboarding } from "./onboarding";
import { employmentStartFor, validateEmploymentStart } from "./employment-month";
import type { Payslip, EmploymentProfile } from "./types";

export function comparisonAccess(slips: Payslip[], profile: EmploymentProfile | null = null) {
  const sequence = consecutiveOnboarding(slips);
  const employerSlug = sequence.slips[0]?.employerSlug;
  const start = employmentStartFor(profile, employerSlug);
  const employmentRequired = sequence.unlocked && (!employerSlug || !start || !!validateEmploymentStart(start.startMonth, employerSlug, slips));
  return { unlocked: sequence.unlocked && !employmentRequired, have: sequence.have, required: sequence.required, needsDetails: sequence.needsDetails, employmentRequired };
}
