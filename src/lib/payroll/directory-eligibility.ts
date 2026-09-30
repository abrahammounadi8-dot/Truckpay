import type { Payslip, EmploymentProfile } from "./types";
import { comparisonAccess } from "./access-state";
import { hasPublicPublicationConsent } from "./publication-consent";
/** Each account must qualify independently for each employer. Only identity leaves this function. */
export function eligibleDirectoryEmployers(slips: Payslip[], profiles: EmploymentProfile[]) {
  const groups = new Map<string, Payslip[]>();
  const contributors = new Set(profiles.filter(hasPublicPublicationConsent).map(profile => profile.userId));
  for (const slip of slips) {
    if (!contributors.has(slip.userId)) continue;
    if (!slip.employerName?.trim() || !slip.employerSlug) continue;
    const key = JSON.stringify([slip.userId, slip.employerSlug]);
    const group = groups.get(key) ?? [];
    group.push(slip); groups.set(key, group);
  }
  return [...groups.values()].filter(group => comparisonAccess(group, profiles.find(p => p.userId === group[0].userId) ?? null).unlocked)
    .map(group => ({ employerName: group[0].employerName, employerSlug: group[0].employerSlug }));
}
