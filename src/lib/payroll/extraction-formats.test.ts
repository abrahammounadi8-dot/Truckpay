// Entirely synthetic examples, not real companies or driver records.
import test from "node:test";
import assert from "node:assert/strict";
import { extractFromPayslipText } from "./extract-text";
import { extractionError } from "./extraction-error";

test("different labelled employer and amount formats", () => {
  for (const [label, name, gross, net, frequency, expectedGross, expectedNet] of [
    ["Employer", "TEST North Haulage", "1,234.56", "1,000.00", "Weekly", 1234.56, 1000],
    ["Employer Name", "TEST South Logistics Ltd", "1234,56", "1000,00", "Fortnightly", 1234.56, 1000],
    ["Company Name", "TEST West Transport", "1.234,56", "1.000,00", "Monthly", 1234.56, 1000],
  ] as const) {
    const draft=extractFromPayslipText(`${label}: ${name}\nPay Date: 30/09/2026\nFrequency: ${frequency}\nGross Pay: ${gross}\nNett Pay: ${net}`);
    assert.equal(draft.fields.employerName,name);
    assert.equal(draft.fields.paymentDate,"2026-09-30");
    assert.equal(draft.fields.grossPay,expectedGross);
    assert.equal(draft.fields.netPay,expectedNet);
    assert.equal(draft.fields.payFrequency,frequency.toLowerCase());
  }
});
test("current pay and deductions never use YTD lines or cumulative sections", () => {
  const draft=extractFromPayslipText("YTD Gross Pay: 10000.00\nYTD PAYE: 900.00\nGross Pay: 1000.00\nPAYE: 90.00\nCumulative Details\nNet Pay: 9000.00");
  assert.equal(draft.fields.grossPay,1000);
  assert.equal(draft.fields.netPay,undefined);
  assert.equal(draft.deductions.find(d=>d.rawLabel==='PAYE')?.amount,90);
});
test("invalid dates, conflicting frequencies and conflicting amounts need review", () => {
  for(const date of ["31/02/2026","2026-02-31","2026-13-01"]) assert.equal(extractFromPayslipText(`Pay Date: ${date}`).fields.paymentDate,undefined);
  assert.equal(extractFromPayslipText("Weekly or Monthly\nNet Pay: 100.00\nNet Pay: 200.00").fields.payFrequency,undefined);
  assert.equal(extractFromPayslipText("Net Pay: 100.00\nNet Pay: 200.00").fields.netPay,undefined);
  assert.equal(extractFromPayslipText("Frequency: Weekly\nMonthly pension summary").fields.payFrequency,"weekly");
  assert.equal(extractFromPayslipText("Employer address: TEST Road\nEmployee Name: TEST PERSON").fields.employerName,undefined);
  assert.equal(extractFromPayslipText("Net Pay: 1,23,4.56").fields.netPay,undefined);
});
test("errors explain a recoverable next step", () => {
  assert.match(extractionError(401,undefined,true),/sesión/);
  assert.match(extractionError(413,undefined,true),/8 MB/);
  assert.match(extractionError(429,undefined,true),/Espera/);
  assert.match(extractionError(200,"Upload one payslip page at a time.",true),/varias páginas/);
});
