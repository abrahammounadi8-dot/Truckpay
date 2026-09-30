import { it } from "node:test";
import assert from "node:assert/strict";
import { PUBLICATION_POLICY, preparePublicationReview, reviewStillMatches, type PublicationInput } from "./publication-policy";
import { companyPayStats } from "./company-stats";

import { publicationFixture as fixture } from "./testing/publication-fixture";

function changeUser(input: PublicationInput, userId: string, change: (s: PublicationInput["payslips"][number], i: number) => PublicationInput["payslips"][number]): PublicationInput {
  let index = 0;
  return { ...input, payslips: input.payslips.map(s => s.userId === userId ? change(s, index++) : s) };
}

it("requires ten reviewed people in each frequency AND historical tenure cell", () => {
  for (const size of [0, 1, 9]) assert.equal(preparePublicationReview(fixture(size)).status, "blocked");
  const input = fixture();
  const result = preparePublicationReview(input);
  assert.equal(result.status, "review_required"); assert.equal(result.publishable, false);
  assert.deepEqual(result.proposal, { policyVersion: PUBLICATION_POLICY.version, employerSlug: "synthetic-firm", period: input.period, currency: "EUR",
    cells: [{ metric: "net_per_payslip", frequency: "weekly", tenureBand: "0_1", medianIntervalEUR: { fromInclusive: 500, toExclusive: 600 } }] });
  // Explicit allowlist: no exact median, user, person, count, suppressed-cell metadata or totals.
  assert.equal(JSON.stringify(result.proposal).includes("543.21"), false);
  assert.equal(JSON.stringify(result.proposal).includes("synthetic-0"), false);
});

it("does not confuse thirty documents, duplicate documents or ten email accounts with ten people", () => {
  const single = fixture(1);
  assert.equal(preparePublicationReview({ ...single, payslips: Array.from({ length: 10 }, () => single.payslips).flat() }).status, "blocked");
  const many = fixture();
  assert.equal(preparePublicationReview({ ...many, reviewedPeople: [] }).status, "blocked");
  assert.equal(preparePublicationReview({ ...many, reviewedPeople: many.reviewedPeople.map(p => ({ ...p, personKey: "same-person" })) }).status, "blocked");
  const duplicate = { ...many, payslips: [...many.payslips, ...many.payslips] };
  assert.deepEqual(preparePublicationReview(duplicate).proposal, preparePublicationReview(many).proposal);
});

it("suppresses 9 weekly plus 1 monthly and 9 junior plus 1 senior without publishing totals", () => {
  let input = changeUser(fixture(), "synthetic-0", (s, i) => ({ ...s, payFrequency: "monthly", paymentDate: ["2025-01-31", "2025-02-28", "2025-03-31"][i] }));
  assert.equal(preparePublicationReview(input).proposal, null);
  input = fixture();
  input.profiles[0].employmentStarts!["synthetic-firm"].startMonth = "2018-01";
  assert.equal(preparePublicationReview(input).proposal, null);
  input = fixture(11);
  input.profiles[0].employmentStarts!["synthetic-firm"].startMonth = "2018-01";
  const result = preparePublicationReview(input);
  assert.equal(result.proposal!.cells.length, 1);
  assert.equal(result.proposal!.cells[0].tenureBand, "0_1");
  assert.equal(JSON.stringify(result.proposal).includes("5_plus"), false);
});

it("one person with native net cannot unlock a cell of ten people with gross amounts", () => {
  const input = fixture();
  const missing = { ...input, payslips: input.payslips.map(s => s.userId === "synthetic-0" ? s : { ...s, netPay: null }) };
  assert.equal(preparePublicationReview(missing).proposal, null);
  for (const value of [null, NaN, Infinity, -1]) {
    assert.equal(preparePublicationReview(changeUser(input, "synthetic-0", s => ({ ...s, netPay: value }))).proposal, null);
  }
  assert.equal(preparePublicationReview(changeUser(input, "synthetic-0", (s, i) => i ? s : { ...s, netPay: null })).proposal, null);
});

it("requires fresh explicit permission; excludes absent, old, withdrawn, malformed and future choices", () => {
  for (const consent of [undefined,
    { enabled: true, noticeVersion: "2026-09-28", updatedAt: "2025-04-02T00:00:00.000Z" },
    { enabled: false, noticeVersion: PUBLICATION_POLICY.noticeVersion, updatedAt: "2025-04-02T00:00:00.000Z" },
    { enabled: true, noticeVersion: PUBLICATION_POLICY.noticeVersion, updatedAt: "invalid" },
    { enabled: true, noticeVersion: PUBLICATION_POLICY.noticeVersion, updatedAt: "2025-04-16T00:00:00.000Z" },
  ]) {
    const input = fixture(); input.profiles[0].statisticsSharing = consent;
    assert.equal(preparePublicationReview(input).status, "blocked");
  }
});

it("does not guess tenure, duplicate ambiguous profiles, mix currencies or include manual corrections", () => {
  let input = fixture(); delete input.profiles[0].employmentStarts;
  assert.equal(preparePublicationReview(input).proposal, null);
  input = fixture();
  assert.equal(preparePublicationReview({ ...input, profiles: [...input.profiles, input.profiles[0]] }).proposal, null);
  assert.equal(preparePublicationReview(changeUser(input, "synthetic-0", s => ({ ...s, currency: "GBP" }))).proposal, null);
  assert.equal(preparePublicationReview(changeUser(input, "synthetic-0", s => ({ ...s, countryCode: "GB" }))).proposal, null);
  assert.equal(preparePublicationReview(changeUser(input, "synthetic-0", s => ({ ...s, manualAmountAudit: { original: {}, submitted: {}, changedFields: [], editedAt: "", source: "local_owner_test" } }))).proposal, null);
});

it("uses historical tenure and excludes a three-slip sequence crossing a tenure boundary", () => {
  let input = fixture();
  input.profiles[0].employmentStarts!["synthetic-firm"].startMonth = "2024-02";
  input = changeUser(input, "synthetic-0", (s, i) => ({ ...s, paymentDate: ["2025-01-24", "2025-01-31", "2025-02-07"][i] }));
  assert.equal(preparePublicationReview(input).proposal, null);
});

it("one contribution per person uses three consecutive payslips, never document weighting", () => {
  const input = fixture();
  const extras = ["2025-01-24", "2025-01-31", "2025-02-07"].map((paymentDate, i) => ({ ...input.payslips[0], id: `extra-${i}`, contentHash: `extra-${i}`, paymentDate, netPay: 999 }));
  const result = preparePublicationReview({ ...input, payslips: [...input.payslips, ...extras] });
  assert.equal(result.audit.cells.find(c => c.frequency === "weekly" && c.tenureBand === "0_1")!.people, 10);
  assert.deepEqual(result.proposal, preparePublicationReview(input).proposal);
});

it("refuses arbitrary/open time windows and employers learned from private payroll", () => {
  const input = fixture();
  for (const period of [{ start: "2025-01-02", end: "2025-03-31" }, { start: "2025-02-30", end: "2025-03-31" }, { start: "2025-04-01", end: "2025-06-30" }]) {
    assert.equal(preparePublicationReview({ ...input, period }).status, "blocked");
  }
  assert.equal(preparePublicationReview({ ...input, publicEmployerSlugs: [] }).status, "blocked");
  assert.equal(preparePublicationReview(changeUser(input, "synthetic-0", s => ({ ...s, createdAt: "2025-04-16T00:00:00.000Z" }))).status, "blocked");
});

it("refuses in-place reissues and excludes prior participants across all employers and periods", () => {
  const input = fixture();
  assert.equal(preparePublicationReview({ ...input, history: [{ employerSlug: input.employerSlug, period: input.period, personKeys: [] }] }).status, "blocked");
  assert.equal(preparePublicationReview({ ...input, history: [{ employerSlug: "another-public-company", period: { start: "2024-10-01", end: "2024-12-31" }, personKeys: [input.reviewedPeople[0].personKey] }] }).status, "blocked");
});

it("revocation, salary correction, changed tenure and a tampered proposal invalidate review", () => {
  const input = fixture(11), review = preparePublicationReview(input);
  assert.equal(reviewStillMatches(review, input), true);
  input.profiles[0].statisticsSharing!.enabled = false;
  assert.equal(reviewStillMatches(review, input), false);
  input.profiles[0].statisticsSharing!.enabled = true;
  assert.equal(reviewStillMatches(review, changeUser(input, "synthetic-0", s => ({ ...s, netPay: 544 }))), false);
  input.profiles[0].employmentStarts!["synthetic-firm"].startMonth = "2024-08";
  assert.equal(reviewStillMatches(review, input), false);
  const fresh = fixture(); const edited = preparePublicationReview(fresh);
  edited.proposal!.cells[0].medianIntervalEUR.fromInclusive = 1;
  assert.equal(reviewStillMatches(edited, fresh), false);
});

it("permuting source order preserves the proposal and review fingerprint", () => {
  const input = fixture(), review = preparePublicationReview(input);
  assert.equal(reviewStillMatches(review, { ...input, payslips: [...input.payslips].reverse(), profiles: [...input.profiles].reverse(), reviewedPeople: [...input.reviewedPeople].reverse() }), true);
});

it("a successful internal review never unlocks the real public statistics function", () => {
  const input = fixture(30);
  assert.equal(preparePublicationReview(input).status, "review_required");
  const output = companyPayStats(input.employerSlug, [...input.payslips], [...input.profiles], input.frozenAt);
  assert.equal(output.publicationStatus, "active"); assert.equal(output.driverCount, 0);
  assert.equal(output.verifiedPayslipCount, 0); assert.deepEqual(output.slices, []);
  assert.ok(output.bands.every(b => !b.published && b.netByFrequency.length === 0));
});
