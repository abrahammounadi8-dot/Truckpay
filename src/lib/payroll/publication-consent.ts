import type { EmploymentProfile } from "./types";
/** Public permission is separate from internal review and requires explicit opt-in. */
export const ACTIVE_PUBLICATION_NOTICE_VERSION = "public-single-contributor-2026-09-30";
export function hasPublicPublicationConsent(profile: EmploymentProfile | null | undefined): boolean {
  const choice = profile?.publicationSharing;
  return choice?.enabled === true && choice.noticeVersion === ACTIVE_PUBLICATION_NOTICE_VERSION;
}
