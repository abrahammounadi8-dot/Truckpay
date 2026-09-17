import { it } from "node:test";
import assert from "node:assert/strict";
import { comparisonAccess } from "./access-state";
import { parsePayslipInput, toStoredPayslip } from "./parse";

function sample(day: number) {
  const date = `2026-08-${String(day).padStart(2, "0")}`;
  const parsed = parsePayslipInput({ employerSlug: "nolan", paymentDate: date, payPeriodStart: date, payPeriodEnd: date, grossPay: 900, netPay: 700, basicHours: 40, basicPay: 900, deductions: [], allowances: [] });
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
  assert.equal(comparisonAccess(slips.map(s => ({ ...s, payPeriodEnd: null }))).needsDetails, true);
  assert.equal(comparisonAccess([slips[0], slips[1], { ...slips[2], employerSlug: "hannon" }]).unlocked, false);
});
it("uses unique content, not raw row count, for progress", () => {
  const slips = [sample(1), sample(8), sample(15)];
  assert.equal(comparisonAccess(slips).have, 3);
  assert.equal(comparisonAccess([slips[0], slips[0], slips[1]]).have, 2);
});
