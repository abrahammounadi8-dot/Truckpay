/**
 * TEST DATA ONLY — synthetic payslip text for automated tests.
 * Not a real driver payslip.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractFromPayslipText } from "./extract-text";

const TEST_SLIP_TEXT = `
TEST DATA ONLY — not a real payslip
Employer: Nolan Transport
Payment Date: 28/03/2024
Pay Period: 18/03/2024 to 24/03/2024
Week 12
Weekly
Basic Hours: 40
Basic Rate: 20.00
Basic Pay: 800.00
Overtime Hours: 5
Overtime Rate: 30.00
Overtime Pay: 150.00
Holiday Pay: 50.00
Gross Pay: 1040.00
Net Pay: 850.00
PAYE 120.00
PRSI 40.00
USC 30.00
PPSN: 1234567T
`;

describe("extract from labelled payslip text", () => {
  it("fills printed fields and ignores PPSN", () => {
    const draft = extractFromPayslipText(TEST_SLIP_TEXT);
    assert.equal(draft.fields.paymentDate, "2024-03-28");
    assert.equal(draft.fields.payPeriodStart, "2024-03-18");
    assert.equal(draft.fields.payPeriodEnd, "2024-03-24");
    assert.equal(draft.fields.weekNumber, 12);
    assert.equal(draft.fields.payFrequency, "weekly");
    assert.equal(draft.fields.basicHours, 40);
    assert.equal(draft.fields.basicRate, 20);
    assert.equal(draft.fields.grossPay, 1040);
    assert.equal(draft.fields.netPay, 850);
    assert.equal(draft.fields.employerName, "Nolan Transport");
    assert.equal(draft.fields.employerSlug, "nolan");
    assert.equal(draft.deductions.some((line) => line.rawLabel === "PAYE" && line.amount === 120), true);
    assert.equal(JSON.stringify(draft).includes("1234567T"), false);
  });

  it("does not invent figures when labels are missing", () => {
    const draft = extractFromPayslipText("TEST DATA ONLY\nThis page has no pay figures.");
    assert.equal(draft.fields.grossPay, undefined);
    assert.equal(draft.fields.weekNumber, undefined);
    assert.equal(draft.filledKeys.length, 0);
  });

  it("reads an unlisted employer from the Employer line", () => {
    const draft = extractFromPayslipText("TEST DATA ONLY\nEmployer: TEST Haulage Co\nGross Pay: 900.00");
    assert.equal(draft.fields.employerName, "TEST Haulage Co");
    assert.equal(draft.fields.employerSlug, "test-haulage-co");
    assert.equal(draft.fields.grossPay, 900);
  });
});
