import type { EmploymentProfile } from "./types";

/**
 * Public publication consent is intentionally dormant.
 * No current notice version is accepted, so internal review permission can never
 * be treated as permission to publish.
 */
export const ACTIVE_PUBLICATION_NOTICE_VERSION: string | null = null;

export function hasPublicPublicationConsent(profile: EmploymentProfile | null | undefined): boolean {
  const choice = profile?.publicationSharing;
  return ACTIVE_PUBLICATION_NOTICE_VERSION !== null
    && choice?.enabled === true
    && choice.noticeVersion === ACTIVE_PUBLICATION_NOTICE_VERSION;
}
