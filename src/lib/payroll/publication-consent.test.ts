import { it } from "node:test";
import assert from "node:assert/strict";
import type { EmploymentProfile } from "./types";
import { hasPublicPublicationConsent } from "./publication-consent";
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

it("a stored publication choice remains disabled while no public notice is active", () => {
  const value: EmploymentProfile = {
    ...profile,
    publicationSharing: { enabled: true, noticeVersion: "draft-notice", updatedAt: "2026-09-30T08:00:00.000Z" },
  };
  assert.equal(hasPublicPublicationConsent(value), false);
});
