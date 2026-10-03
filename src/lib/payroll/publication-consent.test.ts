import { it } from "node:test";
import assert from "node:assert/strict";
import type { EmploymentProfile } from "./types";
import { ACTIVE_PUBLICATION_NOTICE_VERSION, hasPublicPublicationConsent } from "./publication-consent";
import { sharesStatistics, STATISTICS_NOTICE_VERSION } from "./statistics-sharing";

const profile = {
  userId: "user-a",
  employerSlug: null,
  employerName: null,
  employmentStartDate: null,
  tenureMonths: null,
  tenureBand: null,
  tenureSource: null,
  tenureConfidence: null,
  jobType: "other",
  vehicleType: "unknown",
  timeFraction: "full_time",
  shiftType: "mixed",
  payType: "hourly",
  agreedBaseRate: null,
  countryCode: "IE",
  updatedAt: "2026-09-30",
} satisfies EmploymentProfile;

it("internal review permission never counts as public publication permission", () => {
  const value: EmploymentProfile = {
    ...profile,
    statisticsSharing: { enabled: true, noticeVersion: STATISTICS_NOTICE_VERSION, updatedAt: "2026-09-30T08:00:00.000Z" },
  };
  assert.equal(sharesStatistics(value), true);
  assert.equal(hasPublicPublicationConsent(value), false);
});

it("a draft publication choice never enables the active notice", () => {
  const value: EmploymentProfile = {
    ...profile,
    publicationSharing: { enabled: true, noticeVersion: "draft-notice", updatedAt: "2026-09-30T08:00:00.000Z" },
  };
  assert.equal(hasPublicPublicationConsent(value), false);
});

it("explicit opt-in to the active publication notice enables public statistics", () => {
  const value: EmploymentProfile = {
    ...profile,
    publicationSharing: {
      enabled: true,
      noticeVersion: ACTIVE_PUBLICATION_NOTICE_VERSION,
      updatedAt: "2026-09-30T09:00:00.000Z",
    },
  };
  assert.equal(hasPublicPublicationConsent(value), true);
});

it("withdrawing an active publication choice disables public statistics immediately", () => {
  const value: EmploymentProfile = {
    ...profile,
    publicationSharing: {
      enabled: false,
      noticeVersion: ACTIVE_PUBLICATION_NOTICE_VERSION,
      updatedAt: "2026-09-30T10:00:00.000Z",
    },
  };
  assert.equal(hasPublicPublicationConsent(value), false);
});
