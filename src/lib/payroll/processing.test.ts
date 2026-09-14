/**
 * TEST DATA ONLY — synthetic fixtures for automated tests.
 * Not production payroll, not a real driver, not a real employer payslip.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectPayslipAnomalies, detectSetAnomalies } from "./anomalies";
import { findDuplicate, hashFromInput } from "./fingerprint";
import { irishTaxWeek } from "./ie/weeks";
import { parsePayslipInput, toStoredPayslip } from "./parse";
import { hydratePayslip } from "./process";
import { rejectIdentifierFields } from "./privacy";
import type { Payslip, PayslipInput } from "./types";
import { classifyWorkWeek } from "./week";

const TEST_USER = "00000000-0000-4000-8000-000000000001";

function testSlip(overrides: Partial<Payslip> & Pick<Payslip, "id" | "paymentDate">): Payslip {
  return hydratePayslip({
    userId: TEST_USER,
    countryCode: "IE",
    currency: "EUR",
    employerSlug: "nolan",
    payPeriodStart: null,
    payPeriodEnd: null,
    payFrequency: "unknown",
    employmentWeeks: null,
    basicHours: null,
    basicRate: null,
    basicPay: null,
    overtimeHours: null,
    overtimeRate: null,
    overtimePay: null,
    allowances: [],
    deductions: [],
    grossPay: 1000,
    netPay: 800,
    holidayPay: null,
    weekNumber: null,
    cumulativeGross: null,
    cumulativeTax: null,
    cumulativePrsi: null,
    cumulativeUsc: null,
    cumulativePension: null,
    totalInsurableWeeks: null,
    sourceDocumentId: null,
    contentHash: overrides.contentHash ?? overrides.id,
    extractionConfidence: 1,
    reviewStatus: "extracted",
    createdAt: "2026-09-14T00:00:00.000Z",
    ...overrides,
  });
}

describe("Irish tax week (not ISO week)", () => {
  it("starts week 1 on 1 January", () => {
    assert.deepEqual(irishTaxWeek("2024-01-01"), { year: 2024, week: 1 });
    assert.deepEqual(irishTaxWeek("2024-01-07"), { year: 2024, week: 1 });
    assert.deepEqual(irishTaxWeek("2024-01-08"), { year: 2024, week: 2 });
  });

  it("does not use ISO week numbering", () => {
    // 30 Dec 2024 is ISO week 1 of 2025; Irish tax week is 53 of 2024.
    assert.deepEqual(irishTaxWeek("2024-12-30"), { year: 2024, week: 53 });
    assert.deepEqual(irishTaxWeek("2024-12-31"), { year: 2024, week: 53 });
  });
});

describe("payslip weekly classification", () => {
  it("uses a printed week number as source data", () => {
    const assignment = classifyWorkWeek({
      countryCode: "IE",
      weekNumber: 12,
      paymentDate: "2024-03-28",
      payPeriodStart: "2024-03-18",
      payPeriodEnd: "2024-03-24",
    });
    assert.equal(assignment.weekNumber, 12);
    assert.equal(assignment.year, 2024);
    assert.equal(assignment.derived, false);
    assert.equal(assignment.verification_status, "source");
    assert.equal(assignment.basis, "printed_week_number");
  });

  it("derives an Irish tax week only when the period sits inside one tax week", () => {
    const assignment = classifyWorkWeek({
      countryCode: "IE",
      paymentDate: "2024-03-28",
      payPeriodStart: "2024-03-18",
      payPeriodEnd: "2024-03-24",
    });
    assert.equal(assignment.weekNumber, 12);
    assert.equal(assignment.year, 2024);
    assert.equal(assignment.derived, true);
    assert.equal(assignment.verification_status, "derived");
    assert.equal(assignment.basis, "period_dates");
  });

  it("does not guess a week from payment date alone", () => {
    const assignment = classifyWorkWeek({
      countryCode: "IE",
      paymentDate: "2024-03-28",
    });
    assert.equal(assignment.weekNumber, null);
    assert.equal(assignment.year, null);
    assert.equal(assignment.derived, false);
    assert.equal(assignment.verification_status, "needs_review");
    assert.equal(assignment.basis, "insufficient");
  });

  it("does not pick a week when the period spans two Irish tax weeks", () => {
    const assignment = classifyWorkWeek({
      countryCode: "IE",
      paymentDate: "2026-03-22",
      payPeriodStart: "2026-03-16",
      payPeriodEnd: "2026-03-22",
      payFrequency: "weekly",
    });
    assert.equal(assignment.weekNumber, null);
    assert.equal(assignment.verification_status, "needs_review");
  });

  it("does not stuff a multi-week slip into one week", () => {
    const assignment = classifyWorkWeek({
      countryCode: "IE",
      paymentDate: "2026-03-22",
      payPeriodStart: "2026-02-23",
      payPeriodEnd: "2026-03-22",
      payFrequency: "lunar",
      employmentWeeks: 4,
    });
    assert.equal(assignment.weekNumber, null);
    assert.equal(assignment.verification_status, "needs_review");
  });
});

describe("missing information and no-guess behaviour", () => {
  it("stores null for absent fields and does not invent hours, rates or tax", () => {
    const parsed = parsePayslipInput({
      paymentDate: "2024-03-28",
      grossPay: 1000,
    });
    assert.equal(parsed.error, undefined);
    const stored = toStoredPayslip(TEST_USER, parsed.input!);
    assert.equal(stored.basicHours, null);
    assert.equal(stored.basicRate, null);
    assert.equal(stored.overtimeHours, null);
    assert.equal(stored.overtimeRate, null);
    assert.equal(stored.holidayPay, null);
    assert.equal(stored.weekNumber, null);
    assert.equal(stored.provenance?.tax.value, null);
    assert.equal(stored.provenance?.tax.verification_status, "unverified");
    assert.equal(stored.provenance?.basicHours.verification_status, "unverified");
    assert.equal(stored.weeklyRecord?.expected.grossPay, null);
    assert.equal(stored.weeklyRecord?.expected.status, "insufficient_data");
    assert.equal(stored.weeklyRecord?.expected.derived, true);
    assert.equal(stored.weekAssignment?.weekNumber, null);
    assert.equal(stored.weekAssignment?.verification_status, "needs_review");
  });

  it("does not calculate expected pay when overtime hours are unknown", () => {
    const stored = toStoredPayslip(TEST_USER, {
      paymentDate: "2024-03-28",
      payPeriodStart: "2024-03-18",
      payPeriodEnd: "2024-03-24",
      basicHours: 40,
      basicRate: 20,
      overtimeHours: null,
      grossPay: 800,
    });
    assert.equal(stored.weeklyRecord?.expected.grossPay, null);
    assert.match(stored.weeklyRecord?.expected.reason ?? "", /overtime hours are unknown/i);
  });

  it("does not calculate expected pay when overtime hours exist without an overtime rate", () => {
    const stored = toStoredPayslip(TEST_USER, {
      paymentDate: "2024-03-28",
      basicHours: 40,
      basicRate: 20,
      overtimeHours: 6,
      overtimeRate: null,
      grossPay: 800,
    });
    assert.equal(stored.weeklyRecord?.expected.grossPay, null);
    assert.match(stored.weeklyRecord?.expected.reason ?? "", /overtime rate is not on the document/i);
  });

  it("calculates derived expected gross only from source hours, rates and listed allowances", () => {
    const stored = toStoredPayslip(TEST_USER, {
      paymentDate: "2024-03-28",
      payPeriodStart: "2024-03-18",
      payPeriodEnd: "2024-03-24",
      basicHours: 40,
      basicRate: 20,
      overtimeHours: 5,
      overtimeRate: 30,
      holidayPay: 50,
      allowances: [{ rawLabel: "TEST night out", amount: 40 }],
      grossPay: 1040,
    });
    assert.equal(stored.weeklyRecord?.expected.grossPay, 40 * 20 + 5 * 30 + 40 + 50);
    assert.equal(stored.weeklyRecord?.expected.status, "calculated");
    assert.equal(stored.weeklyRecord?.expected.derived, true);
    assert.match(stored.weeklyRecord?.expected.reason ?? "", /not printed on the payslip/i);
    assert.equal(stored.provenance?.hourlyRate.source, "source");
    assert.equal(stored.weeklyRecord?.actual.grossPay, 1040);
  });

  it("rejects PPSN / licence / employee number fields instead of storing them", () => {
    const parsed = parsePayslipInput({
      paymentDate: "2024-03-28",
      grossPay: 1000,
      ppsn: "TEST123456",
    });
    assert.match(parsed.error ?? "", /does not store/i);
    assert.equal(rejectIdentifierFields({ licence: "DLTEST" }) != null, true);
    assert.equal(rejectIdentifierFields({ paymentDate: "2024-03-28" }), null);
  });
});

describe("duplicate detection", () => {
  it("confirms a duplicate when dates and totals match", () => {
    const input: PayslipInput = {
      employerSlug: "nolan",
      paymentDate: "2024-03-28",
      payPeriodStart: "2024-03-18",
      payPeriodEnd: "2024-03-24",
      grossPay: 1000,
      netPay: 800,
      basicPay: 800,
      basicHours: 40,
    };
    const hash = hashFromInput(input);
    const first = testSlip({
      id: "test-dup-a",
      paymentDate: "2024-03-28",
      contentHash: hash,
      grossPay: 1000,
      netPay: 800,
    });
    const second = testSlip({
      id: "test-dup-b",
      paymentDate: "2024-03-28",
      contentHash: hash,
      grossPay: 1000,
      netPay: 800,
    });
    assert.equal(findDuplicate([first], hash)?.id, "test-dup-a");
    const anomalies = detectSetAnomalies([first, second], null);
    const duplicates = anomalies.filter((item) => item.kind === "duplicate_payslip");
    assert.ok(duplicates.length >= 1);
    assert.equal(duplicates[0]?.status, "confirmed");
  });
});

describe("anomaly detection foundation", () => {
  it("marks missing hours as insufficient_data, not confirmed", () => {
    const slip = testSlip({ id: "test-hours", paymentDate: "2024-03-28", basicHours: null, grossPay: 900 });
    const anomalies = detectPayslipAnomalies(slip, [], null);
    const missing = anomalies.find((item) => item.kind === "missing_hours");
    assert.equal(missing?.status, "insufficient_data");
  });

  it("does not confirm unpaid overtime when rate and pay are absent", () => {
    const slip = testSlip({
      id: "test-ot",
      paymentDate: "2024-03-28",
      overtimeHours: 8,
      overtimeRate: null,
      overtimePay: null,
    });
    const anomalies = detectPayslipAnomalies(slip, [], null);
    const unpaid = anomalies.find((item) => item.kind === "unpaid_overtime");
    assert.equal(unpaid?.status, "insufficient_data");
  });

  it("flags an unknown deduction as needs_review, never confirmed unlawful", () => {
    const stored = toStoredPayslip(TEST_USER, {
      paymentDate: "2024-03-28",
      grossPay: 1000,
      deductions: [{ rawLabel: "TEST yard locker", amount: 12 }],
    });
    const anomalies = detectPayslipAnomalies(stored, [], null);
    const unexpected = anomalies.find((item) => item.kind === "unexpected_deduction");
    assert.equal(unexpected?.status, "needs_review");
    assert.equal(/illegal|unlawful employer/i.test(JSON.stringify(anomalies)), false);
  });

  it("marks a classified week gap as possible_anomaly, not confirmed missing pay", () => {
    const week10 = testSlip({
      id: "test-w10",
      paymentDate: "2024-03-14",
      payPeriodStart: "2024-03-04",
      payPeriodEnd: "2024-03-10",
      weekNumber: 10,
      grossPay: 900,
    });
    const week12 = testSlip({
      id: "test-w12",
      paymentDate: "2024-03-28",
      payPeriodStart: "2024-03-18",
      payPeriodEnd: "2024-03-24",
      weekNumber: 12,
      grossPay: 900,
    });
    assert.equal(week10.weekAssignment?.weekNumber, 10);
    assert.equal(week12.weekAssignment?.weekNumber, 12);
    const anomalies = detectSetAnomalies([week10, week12], null);
    const gap = anomalies.find((item) => item.kind === "missing_week" && item.status === "possible_anomaly");
    assert.ok(gap);
    assert.match(gap!.summary, /11/);
  });

  it("does not confirm an incorrect rate from an unverified profile rate", () => {
    const slip = testSlip({
      id: "test-rate",
      paymentDate: "2024-03-28",
      basicRate: 18,
    });
    const anomalies = detectPayslipAnomalies(slip, [], {
      userId: TEST_USER,
      employerSlug: "nolan",
      employmentStartDate: "2024-01-01",
      tenureMonths: 8,
      tenureBand: "0_1",
      tenureSource: "user_declared",
      tenureConfidence: 0.4,
      jobType: "distribution",
      vehicleType: "articulated",
      timeFraction: "full_time",
      shiftType: "day",
      payType: "hourly",
      agreedBaseRate: 21.5,
      countryCode: "IE",
      updatedAt: "2026-09-14T00:00:00.000Z",
    });
    const rate = anomalies.find((item) => item.kind === "incorrect_hourly_rate");
    assert.equal(rate?.status, "insufficient_data");
  });
});

describe("hydrate legacy slips", () => {
  it("attaches week assignment and source provenance to slips stored before processing existed", () => {
    const legacy: Payslip = {
      id: "test-legacy-monthly",
      userId: TEST_USER,
      countryCode: "IE",
      currency: "EUR",
      employerSlug: "nolan",
      paymentDate: "2026-09-04",
      payPeriodStart: "2026-08-01",
      payPeriodEnd: "2026-08-31",
      payFrequency: "monthly",
      employmentWeeks: 4,
      basicHours: 160,
      basicRate: 16.5,
      basicPay: 2500,
      overtimeHours: 12,
      overtimeRate: 24.75,
      overtimePay: 297,
      allowances: [],
      deductions: [],
      grossPay: 2897,
      netPay: 2100,
      holidayPay: null,
      weekNumber: null,
      cumulativeGross: null,
      cumulativeTax: null,
      cumulativePrsi: null,
      cumulativeUsc: null,
      cumulativePension: null,
      totalInsurableWeeks: null,
      sourceDocumentId: null,
      contentHash: "test-legacy-monthly",
      extractionConfidence: 1,
      reviewStatus: "extracted",
      createdAt: "2026-09-14T00:00:00.000Z",
    };
    const hydrated = hydratePayslip(legacy);
    assert.equal(hydrated.weekAssignment?.weekNumber, null);
    assert.equal(hydrated.weekAssignment?.verification_status, "needs_review");
    assert.match(hydrated.weekAssignment?.reason ?? "", /more than one week/i);
    assert.equal(hydrated.provenance?.basicHours.verification_status, "source");
    assert.equal(hydrated.provenance?.basicHours.value, 160);
    assert.equal(hydrated.provenance?.hourlyRate.verification_status, "source");
    assert.equal(hydrated.weeklyRecord?.expected.status, "calculated");
  });
});
