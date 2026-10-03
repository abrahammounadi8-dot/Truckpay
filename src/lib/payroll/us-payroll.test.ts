import test from "node:test";
import assert from "node:assert/strict";
import { extractUsPayslipText } from "./us/extract-text";
import { parsePayslipInput, toStoredPayslip } from "./parse";
import { reconcilePayslip } from "./reconcile";
import { classifyDeduction } from "./classify";
import { amountSnapshot, checkAmountReceipt, issueAmountReceipt } from "./amount-review";
import { hashFromInput } from "./fingerprint";
import { parseReportInput } from "../report-input";
const synthetic = `TEST ONLY — NOT A REAL PAY STUB
Employer: TEST Example Carrier
Pay Date: 03/04/2026
Period Start: 02/23/2026
Period End: 03/01/2026
Frequency: Weekly
Paid Miles: 2,500
Rate Per Mile: $0.6255
Mileage Pay: $1,563.75
Gross Pay: $1,563.75
Federal Income Tax: $100.00
Social Security: $96.95
Medicare: $22.67
Net Pay: $1,344.13
YTD
Gross Pay: $9,000.00
Net Pay: $7,000.00`;
test("US labelled current-period figures preserve US dates, USD and rate precision", () => {
  const draft = extractUsPayslipText(synthetic);
  assert.equal(draft.fields.paymentDate, "2026-03-04");
  assert.equal(draft.fields.netPay, 1344.13);
  assert.equal(draft.fields.ratePerMile, 0.6255);
  const parsed = parsePayslipInput({ ...draft.fields, deductions: draft.deductions });
  assert.equal(parsed.error, undefined);
  const slip = toStoredPayslip("test", parsed.input!);
  assert.equal(slip.countryCode, "US"); assert.equal(slip.currency, "USD");
  assert.match(slip.employerSlug!, /^us-/);
  assert.equal(slip.ratePerMile, 0.6255);
  assert.deepEqual(slip.deductions.map(d => d.normalizedCategory), ["FEDERAL_TAX", "SOCIAL_SECURITY", "MEDICARE"]);
  assert.equal(reconcilePayslip(slip, []).some(f => f.kind === "arithmetic_mileage"), false);
  assert.equal(reconcilePayslip({ ...slip, mileagePay: 1600 }, []).find(f => f.kind === "arithmetic_mileage")?.evidence.expected, 1563.75);
  assert.equal(slip.weekAssignment?.weekNumber, null); // no Irish tax week in the US
});
test("unsupported settlements, semimonthly and foreign currency documents fail without invented figures", () => {
  for (const prefix of ["Owner-operator settlement statement", "1099", "Frequency: Semi-monthly", "Currency: EUR"]) {
    assert.deepEqual(extractUsPayslipText(prefix + "\n" + synthetic).fields, {});
  }
  assert.equal(extractUsPayslipText("Net Pay: $100.00\nNet Pay: $200.00").fields.netPay, undefined);
  assert.equal(extractUsPayslipText("Net Pay: $100.00 $900.00 YTD").fields.netPay, undefined);
  assert.equal(extractUsPayslipText("Pay Date: 02/30/2026").fields.paymentDate, undefined);
});
test("US classifications do not guess Irish tax or ambiguous FICA amounts", () => {
  for (const label of ["PAYE", "PRSI", "USC", "FICA", "Employer Social Security"]) assert.equal(classifyDeduction(label, 10, "US").normalizedCategory, "UNKNOWN");
  assert.equal(classifyDeduction("Federal Income Tax", 10, "IE").normalizedCategory, "PAYE");
});
test("country, currency and mileage amounts are bound to source receipt", () => {
  const draft = extractUsPayslipText(synthetic);
  const input = parsePayslipInput({ ...draft.fields, deductions: draft.deductions }).input!;
  const receipt = issueAmountReceipt("test", amountSnapshot(draft.fields, draft.deductions));
  assert.deepEqual(checkAmountReceipt("test", receipt, input), {});
  for (const modified of [{ ...input, countryCode: "IE" as const, currency: "EUR" as const }, { ...input, ratePerMile: 0.9 }]) assert.ok(checkAmountReceipt("test", receipt, modified).error);
  assert.ok(parsePayslipInput({ ...input, currency: "EUR" }).error);
  assert.ok(parsePayslipInput({ ...input, ssn: "TEST-IDENTIFIER" }).error);
  assert.notEqual(hashFromInput(input), hashFromInput({ ...input, countryCode: "IE", currency: "EUR" }));
});
test("per-mile reports require US market and preserve USD-per-mile rate", () => {
  const base = { companyName: "TEST Carrier", weeklyPay: 1200, hoursPerWeek: 45, payType: "mile", ratePerMile: 0.6255 };
  assert.equal(parseReportInput({ ...base, countryCode: "US" }).report?.ratePerMile, 0.6255);
  assert.ok(parseReportInput({ ...base, countryCode: "IE" }).error);
  assert.ok(parseReportInput({ ...base, countryCode: "US", ratePerMile: undefined }).error);
});
test("three US source receipts prepare a consecutive USD batch without Irish tax weeks", async () => {
  const { preparePayslipBatch } = await import("./prepare-batch");
  const { analyseLatestSet } = await import("./analysis");
  const records = [
    ["03/04/2026", "02/23/2026", "03/01/2026"],
    ["03/11/2026", "03/02/2026", "03/08/2026"],
    ["03/18/2026", "03/09/2026", "03/15/2026"],
  ].map(([pay, start, end]) => {
    const draft = extractUsPayslipText(synthetic.replace("03/04/2026", pay).replace("02/23/2026", start).replace("03/01/2026", end));
    return { ...draft.fields, deductions: draft.deductions, allowances: [], amountReceipt: issueAmountReceipt("test-batch", amountSnapshot(draft.fields, draft.deductions)) };
  });
  const slips = preparePayslipBatch("test-batch", records, "2025-01");
  assert.ok(slips.every(slip => slip.countryCode === "US" && slip.currency === "USD"));
  const analysis = analyseLatestSet(slips, null);
  assert.equal(analysis.have, 3);
  assert.equal(analysis.status, "verified");
  assert.equal(analysis.ownNetByFrequency[0].medianNet, 1344.13);
});
