import type { EmploymentProfile } from "./types";

// Permission for internal disclosure review only; this does not authorise publication.
export const STATISTICS_NOTICE_VERSION = "tenure-review-2026-09-29";
export const STATISTICS_REVIEW_RULES = Object.freeze({ minimumPeoplePerCell: 10, intervalEuros: 100 });
export function sharesStatistics(profile: EmploymentProfile | null | undefined): boolean {
  return profile?.statisticsSharing?.enabled === true
    && profile.statisticsSharing.noticeVersion === STATISTICS_NOTICE_VERSION;
}
