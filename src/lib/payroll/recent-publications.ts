import type { Company } from "../types";
import type { EmploymentProfile, Payslip } from "./types";
import { companyPayStats } from "./company-stats";
import { resolveEmployer } from "./employer";
import { consecutiveOnboarding } from "./onboarding";
import { hasPublicPublicationConsent } from "./publication-consent";

/** Ordering only: publication dates and account identifiers never leave this function. */
export function recentPublicationCompanies(companies: Company[], slips: Payslip[], profiles: EmploymentProfile[], now: string) {
  const activity = new Map<string, number>();
  const limit = Date.parse(now);
  const timestamp = (value: string | undefined) => {
    const parsed = Date.parse(value ?? "");
    return Number.isFinite(parsed) && parsed <= limit ? parsed : 0;
  };
  for (const profile of profiles.filter(hasPublicPublicationConsent)) {
    const owned = slips.filter(s => s.userId === profile.userId && !s.manualAmountAudit && consecutiveOnboarding([s]).have === 1);
    for (const slug of new Set(owned.map(s => s.employerSlug).filter((s): s is string => !!s))) {
      const records = owned.filter(s => s.employerSlug === slug);
      if (!companyPayStats(slug, records, profiles.filter(p => p.userId === profile.userId), now).driverCount) continue;
      const latest = Math.max(timestamp(profile.publicationSharing?.updatedAt), ...records.map(s => timestamp(s.createdAt)));
      activity.set(slug, Math.max(activity.get(slug) ?? 0, latest));
    }
  }
  const score = (company: Company) => activity.get(resolveEmployer(company.name).employerSlug ?? company.slug);
  const ordered = [...companies].sort((a, b) => {
    const first = score(a), second = score(b);
    if (first !== undefined && second === undefined) return -1;
    if (first === undefined && second !== undefined) return 1;
    return (second ?? 0) - (first ?? 0) || a.name.localeCompare(b.name);
  });
  // Reserve positions one and three for the two latest qualifying publications.
  // With fewer than three companies, keep the compact chronological order.
  if (ordered.length < 3 || score(ordered[1]) === undefined) return ordered;
  return [ordered[0], ordered[2], ordered[1], ...ordered.slice(3)];
}
