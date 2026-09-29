import { consecutiveOnboarding } from "./onboarding";
import { it } from "node:test";
import assert from "node:assert/strict";
import { analyseLatestSet } from "./analysis";
import { comparisonAccess as actualComparisonAccess } from "./access-state";
import { parsePayslipInput, toStoredPayslip } from "./parse";

import { toStoredProfile } from "./profile";
function comparisonAccess(slips: import('./types').Payslip[]) {
 const profile=toStoredProfile("test-only",{},"2026-09-25");
 profile.employmentStarts=Object.fromEntries(slips.filter(s=>s.employerSlug).map(s=>[s.employerSlug!,{employerName:s.employerName??s.employerSlug!,startMonth:"2020-01",source:"user_declared" as const,updatedAt:""}]));
 return actualComparisonAccess(slips,profile);
}
function sample(day: number) {
  const date = `2026-08-${String(day).padStart(2, "0")}`;
  const parsed = parsePayslipInput({ employerSlug: "nolan", paymentDate: date, payPeriodStart: date, payPeriodEnd: new Date(Date.parse(date) + 6 * 86400000).toISOString().slice(0, 10), payFrequency: "weekly", grossPay: 900, netPay: 700, basicHours: 40, basicPay: 900, deductions: [], allowances: [] });
  assert.ok(parsed.input, parsed.error ?? "Valid synthetic payslip");
  return toStoredPayslip("test-only", parsed.input);
}
it("keeps verified analysis locked before three distinct slips", () => {
  assert.equal(comparisonAccess([]).unlocked, false);
  assert.equal(comparisonAccess([sample(1), sample(8)]).unlocked, false);
  assert.equal(comparisonAccess([sample(1), sample(1), sample(1)]).have, 1);
});
it("unlocks with three complete distinct slips and relocks after removal", () => {
  const slips = [sample(1), sample(8), sample(15)];
  assert.equal(comparisonAccess(slips).unlocked, true);
  assert.equal(comparisonAccess(slips.slice(1)).unlocked, false);
});
it("does not unlock three incomplete or mixed-employer slips", () => {
  const slips = [sample(1), sample(8), sample(15)];
  assert.equal(comparisonAccess(slips.map(s => ({ ...s, payPeriodEnd: null, payFrequency: "unknown" as const }))).needsDetails, true);
  assert.equal(comparisonAccess([slips[0], slips[1], { ...slips[2], employerSlug: "hannon" }]).unlocked, false);
});
it("uses unique content, not raw row count, for progress", () => {
  const slips = [sample(1), sample(8), sample(15)];
  assert.equal(comparisonAccess(slips).have, 3);
  assert.equal(comparisonAccess([slips[0], slips[0], slips[1]]).have, 2);
});

it("allows weekly payment cadence without inventing worked dates", () => {
  const slips = [sample(1), sample(8), sample(15)].map(s => ({ ...s, payPeriodStart: null, payPeriodEnd: null }));
  assert.equal(comparisonAccess(slips).unlocked, true);
  assert.ok(slips.every(s => s.payPeriodStart === null && s.payPeriodEnd === null));
});
it("does not unlock gaps, overlapping periods, monthly slips or mixed employers", () => {
  assert.equal(comparisonAccess([sample(1), sample(8), sample(22)]).unlocked, false);
  const slips = [sample(1), sample(8), sample(15)];
  assert.equal(comparisonAccess(slips.map(s => ({ ...s, payFrequency: "monthly" as const }))).unlocked, false);
  assert.equal(comparisonAccess(slips.map(s => ({ ...s, payPeriodStart: "2026-08-01", payPeriodEnd: "2026-08-07" }))).unlocked, false);
});
it("keeps access after initial completion when more slips are added individually", () => {
  const slips = [sample(1), sample(8), sample(15), sample(29)];
  assert.equal(comparisonAccess(slips).unlocked, true);
  assert.equal(comparisonAccess(slips).have, 3);
});
it("counts only the best eligible consecutive sequence", () => {
  assert.equal(comparisonAccess([sample(1), sample(8), sample(22)]).have, 2);
});

it("recalculates progress after each import and accepts a missing middle week added last", () => {
  const first = sample(1);
  const middle = sample(8);
  const last = sample(15);
  assert.equal(comparisonAccess([first]).have, 1);
  assert.equal(comparisonAccess([middle, first]).have, 2);
  assert.equal(comparisonAccess([last, middle, first]).unlocked, true);
  assert.equal(comparisonAccess([last, first]).have, 1);
  assert.equal(comparisonAccess([middle, last, first]).have, 3);
});

it("marks cadence as inference while allowing analysis without worked dates", () => {
  const slips = [sample(1), sample(8), sample(15)].map(s => ({ ...s, payPeriodStart: null, payPeriodEnd: null }));
  const analysis = analyseLatestSet(slips, null);
  assert.equal(analysis.status, "verified");
  assert.equal(analysis.sequence.consecutiveEpistemic, "inference");
  assert.equal(analysis.sequence.periodsExtracted, false);
});
it("does not allow an inferred cadence to override a printed multi-week period", () => {
  const slips = [sample(1), sample(8), sample(15)].map(s => ({ ...s, payPeriodStart: "2026-07-01", payPeriodEnd: "2026-07-31" }));
  assert.equal(comparisonAccess(slips).unlocked, false);
});

function cadenceSample(date: string, frequency: "monthly" | "fortnightly") {
  return { ...sample(1), id: `test-${frequency}-${date}`, contentHash: `test-${frequency}-${date}`, paymentDate: date, payPeriodStart: null, payPeriodEnd: null, payFrequency: frequency };
}
it("counts fortnightly payments 1, 2, 3 and blocks a missing fortnight", () => {
  const slips = ["2026-01-02", "2026-01-16", "2026-01-30"].map(d => cadenceSample(d, "fortnightly"));
  assert.equal(comparisonAccess(slips.slice(0, 1)).have, 1);
  assert.equal(comparisonAccess(slips.slice(0, 2)).have, 2);
  assert.equal(comparisonAccess(slips).unlocked, true);
  assert.equal(comparisonAccess([slips[0], slips[2]]).have, 1);
});
it("accepts monthly cadence across year boundaries and variable month lengths", () => {
  const slips = ["2023-12-29", "2024-01-31", "2024-02-29"].map(d => cadenceSample(d, "monthly"));
  assert.equal(comparisonAccess(slips.slice(0, 2)).have, 2);
  assert.equal(comparisonAccess(slips).unlocked, true);
  assert.equal(analyseLatestSet(slips, null).sequence.consecutiveEpistemic, "inference");
  assert.equal(comparisonAccess([slips[0], slips[2]]).unlocked, false);
});
it("validates printed calendar months including leap February", () => {
  const slips = [
    ["2024-01-01", "2024-01-31"], ["2024-02-01", "2024-02-29"], ["2024-03-01", "2024-03-31"],
  ].map(([start, end]) => ({ ...cadenceSample(end, "monthly"), payPeriodStart: start, payPeriodEnd: end }));
  assert.equal(comparisonAccess(slips).unlocked, true);
  assert.equal(analyseLatestSet(slips, null).sequence.consecutiveEpistemic, "fact");
  assert.equal(comparisonAccess(slips.map(s => ({ ...s, payFrequency: "unknown" as const }))).unlocked, true);
  assert.equal(comparisonAccess([slips[0], {...slips[1], payPeriodEnd: "2024-03-01"}, slips[2]]).unlocked, false);
});
it("never combines different frequencies or employers into one sequence", () => {
  const slips = ["2026-01-15", "2026-02-15", "2026-03-15"].map(d => cadenceSample(d, "monthly"));
  assert.equal(comparisonAccess([slips[0], {...slips[1], payFrequency: "fortnightly"}, slips[2]]).unlocked, false);
  assert.equal(comparisonAccess([slips[0], {...slips[1], employerSlug: "different"}, slips[2]]).unlocked, false);
  assert.equal(comparisonAccess([slips[0], slips[0], slips[0]]).have, 1);
});


it("marks only records bordering a genuine gap, and clears it when filled", () => {
  const { gaps: single } = consecutiveOnboarding([sample(1)]);
  assert.deepEqual(single, {});
  const first = sample(1), middle = sample(8), last = sample(15);
  assert.deepEqual(consecutiveOnboarding([first, middle]).gaps, {});
  assert.deepEqual(consecutiveOnboarding([first, first]).gaps, {});
  assert.deepEqual(new Set(Object.keys(consecutiveOnboarding([last, first]).gaps)), new Set([first.id, last.id]));
  assert.deepEqual(consecutiveOnboarding([last, middle, first]).gaps, {});
  assert.deepEqual(consecutiveOnboarding([first, { ...last, employerSlug: "other" }]).gaps, {});
  assert.deepEqual(consecutiveOnboarding([first, { ...last, payFrequency: "monthly" }]).gaps, {});
});
it("labels gaps by frequency without mistaking short sets for gaps", () => {
  for (const frequency of ["monthly", "fortnightly"] as const) {
    const dates = frequency === "monthly" ? ["2026-01-31", "2026-02-28", "2026-03-31"] : ["2026-01-02", "2026-01-16", "2026-01-30"];
    const [a, b, c] = dates.map(d => cadenceSample(d, frequency));
    assert.deepEqual(consecutiveOnboarding([a, b]).gaps, {});
    assert.deepEqual(consecutiveOnboarding([a, c]).gaps, { [a.id]: frequency, [c.id]: frequency });
  }
});

it("analyses a completed consecutive set even when a newer isolated slip exists", () => {
  const analysis = analyseLatestSet([sample(1), sample(8), sample(15), sample(29)], null);
  assert.equal(analysis.status, "verified");
  assert.deepEqual(analysis.latest.map(s => s.paymentDate), ["2026-08-15", "2026-08-08", "2026-08-01"]);
});

it("requires an employer-specific start even after three consecutive records",()=>{
 const a=[sample(1),sample(8),sample(15)];
 const profile=toStoredProfile("test-only",{},"2026-09-25");
 assert.equal(actualComparisonAccess(a,profile).unlocked,false);
 profile.employmentStarts={nolan:{employerName:"Nolan",startMonth:"2020-01",source:"user_declared",updatedAt:""}};
 assert.equal(actualComparisonAccess(a,profile).unlocked,true);
 const b=a.map(s=>({...s,employerSlug:"other"}));
 assert.equal(actualComparisonAccess(b,profile).unlocked,false);
 assert.equal(actualComparisonAccess(a,null).unlocked,false);
});
