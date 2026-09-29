import type { EmploymentProfile } from "./types";

export const STATISTICS_NOTICE_VERSION = "2026-09-28";
export function sharesStatistics(profile: EmploymentProfile | null | undefined): boolean {
  return profile?.statisticsSharing?.enabled === true
    && profile.statisticsSharing.noticeVersion === STATISTICS_NOTICE_VERSION;
}
