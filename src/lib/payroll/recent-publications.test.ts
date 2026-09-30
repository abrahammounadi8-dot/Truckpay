import { it } from "node:test";
import assert from "node:assert/strict";
import { recentPublicationCompanies } from "./recent-publications";
import { publicationFixture } from "./testing/publication-fixture";
import { ACTIVE_PUBLICATION_NOTICE_VERSION } from "./publication-consent";
import { addRegisteredEmployers } from "../directory-companies";

function fixture() {
  const base = publicationFixture(1);
  const entries = ["Older Firm", "Newest Firm", "Next Firm"];
  const slugs = ["older-firm", "newest-firm", "next-firm"];
  const dates = ["2026-09-20", "2026-09-29", "2026-09-28"];
  const companies = addRegisteredEmployers([], [...entries, "Catalogue Firm"].map(employerName => ({ employerName })));
  const profiles = entries.map((employerName, i) => ({ ...base.profiles[0], userId: String(i),
    publicationSharing: { enabled: true, noticeVersion: ACTIVE_PUBLICATION_NOTICE_VERSION, updatedAt: dates[i] },
    employmentStarts: { [slugs[i]]: { ...base.profiles[0].employmentStarts!["synthetic-firm"], employerName } } }));
  const slips = entries.flatMap((employerName, i) => base.payslips.map(s => ({ ...s, userId: String(i), employerName, employerSlug: slugs[i] })));
  return { companies, profiles, slips };
}
it("places the newest publications first and third, independent of alphabetical names", () => {
  const { companies, profiles, slips } = fixture();
  const result = recentPublicationCompanies(companies, slips, profiles, "2026-09-30");
  assert.deepEqual(result.map(c => c.slug), ["newest-firm", "older-firm", "next-firm", "catalogue-firm"]);
  assert.deepEqual(result.map(c => Object.keys(c)), result.map(() => Object.keys(companies[0])));
});
it("withdrawn, incomplete and manual contributions cannot gain a featured position", () => {
  const { companies, profiles, slips } = fixture();
  profiles[1].publicationSharing.enabled = false;
  const result = recentPublicationCompanies(companies, slips.filter(s => s.userId !== "2" || s === slips[6]), profiles, "2026-09-30");
  assert.equal(result[0].slug, "older-firm");
  const manual = slips.map(s => ({ ...s, manualAmountAudit: { original: {}, submitted: {}, changedFields: [], editedAt: "", source: "local_owner_test" as const } }));
  assert.deepEqual(recentPublicationCompanies(companies, manual, profiles, "2026-09-30").map(c => c.slug), ["catalogue-firm", "newest-firm", "next-firm", "older-firm"]);
});
it("new qualifying uploads update placement and short lists never duplicate a company", () => {
  const { companies, profiles, slips } = fixture();
  slips[0].createdAt = "2026-09-30T00:00:00.000Z";
  const result = recentPublicationCompanies(companies, slips, profiles, "2026-09-30T12:00:00.000Z");
  assert.equal(result[0].slug, "older-firm");assert.equal(result[2].slug, "newest-firm");
  for (const count of [0, 1, 2]) assert.equal(new Set(recentPublicationCompanies(companies.slice(0, count), slips, profiles, "2026-09-30").map(c => c.slug)).size, count);
});
