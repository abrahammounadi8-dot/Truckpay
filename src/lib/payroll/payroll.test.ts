import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyseLatestSet } from "./analysis";
import { compareLatestToRecent } from "./change";
import { classifyDeduction } from "./classify";
import { companyPayStats } from "./company-stats";
import { payConfidence } from "./confidence";
import { findDuplicate, hashFromInput } from "./fingerprint";
import { reconcilePayslip } from "./reconcile";
import { inspectSequence } from "./sequence";
import { isDocumentVerifiedTenure, tenureBandFromMonths, tenureMonthsFromStart } from "./tenure";
import type { EmploymentProfile, Payslip, PayslipInput } from "./types";
import { weeklyEquivalentGross, weeklyMethod } from "./weekly";

function slip(overrides: Partial<Payslip> & Pick<Payslip, "id" | "paymentDate">): Payslip {
  return {
    userId: "user-a",
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
    grossPay: null,
    netPay: null,
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
  };
}

function profile(overrides: Partial<EmploymentProfile> = {}): EmploymentProfile {
  return {
    userId: "user-a",
    employerSlug: "nolan",
    employmentStartDate: "2024-01-01",
    tenureMonths: 20,
    tenureBand: "1_3",
    tenureSource: "user_declared",
    tenureConfidence: 0.4,
    jobType: "distribution",
    vehicleType: "articulated",
    timeFraction: "full_time",
    shiftType: "night",
    payType: "hourly",
    agreedBaseRate: 21.5,
    countryCode: "IE",
    updatedAt: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("weekly equivalent", () => {
  it("uses insurable weeks and does not treat a lunar slip as one week", () => {
    const lunar = slip({
      id: "1",
      paymentDate: "2026-03-22",
      payFrequency: "lunar",
      employmentWeeks: 4,
      grossPay: 4000,
      basicHours: 160,
    });
    assert.equal(weeklyMethod(lunar), "insurable_weeks");
    assert.equal(weeklyEquivalentGross(lunar), 1000);
  });

  it("returns unknown weekly equivalent when frequency and period are missing", () => {
    const mystery = slip({ id: "2", paymentDate: "2026-03-22", grossPay: 2100 });
    assert.equal(weeklyMethod(mystery), "unknown");
    assert.equal(weeklyEquivalentGross(mystery), null);
  });
});

describe("duplicates", () => {
  it("detects the same dates and totals", () => {
    const input: PayslipInput = {
      employerSlug: "nolan",
      paymentDate: "2026-03-22",
      payPeriodStart: "2026-02-23",
      payPeriodEnd: "2026-03-22",
      grossPay: 2400,
      netPay: 2100,
      basicPay: 2100,
      basicHours: 160,
    };
    const hash = hashFromInput(input);
    const existing = [slip({ id: "dup", paymentDate: "2026-03-22", contentHash: hash })];
    assert.equal(findDuplicate(existing, hash)?.id, "dup");
    assert.equal(findDuplicate(existing, hashFromInput({ ...input, netPay: 2101 })), undefined);
  });
});

describe("Irish deductions", () => {
  it("classifies PAYE/PRSI/USC as statutory and unknown labels as review, never illegal", () => {
    assert.equal(classifyDeduction("PAYE", 200).normalizedCategory, "PAYE");
    assert.equal(classifyDeduction("PRSI", 80).statutoryClass, "statutory");
    assert.equal(classifyDeduction("USC", 50).normalizedCategory, "USC");
    const locker = classifyDeduction("Yard locker fee", 15);
    assert.equal(locker.normalizedCategory, "UNKNOWN");
    assert.equal(locker.needsReview, true);
    assert.equal(/illegal/i.test(JSON.stringify(locker)), false);
  });
});

describe("reconcile", () => {
  it("flags multi-week payments and hours×rate gaps as facts, not wrongdoing", () => {
    const findings = reconcilePayslip(
      slip({
        id: "r1",
        paymentDate: "2026-03-22",
        payPeriodStart: "2026-02-23",
        payPeriodEnd: "2026-03-22",
        payFrequency: "lunar",
        employmentWeeks: 4,
        basicHours: 160,
        basicRate: 14,
        basicPay: 2100,
        grossPay: 2400,
        netPay: 2100,
        deductions: [classifyDeduction("PAYE", 200), classifyDeduction("Yard locker fee", 15)],
      }),
      [],
    );
    const kinds = findings.map((item) => item.kind);
    assert.ok(kinds.includes("multi_week_payment"));
    assert.ok(kinds.includes("arithmetic_basic"));
    assert.ok(kinds.includes("unknown_deduction"));
    assert.equal(findings.some((item) => /\bis illegal\b|underpaid you|employer stole/i.test(item.summary)), false);
    assert.equal(findings.find((item) => item.kind === "unknown_deduction")?.epistemic, "unknown");
  });
});

describe("sequence", () => {
  it("warns on a missing period without accusing the employer", () => {
    const report = inspectSequence([
      slip({
        id: "a",
        paymentDate: "2026-01-07",
        payPeriodStart: "2025-12-31",
        payPeriodEnd: "2026-01-06",
        payFrequency: "weekly",
        employmentWeeks: 1,
      }),
      slip({
        id: "c",
        paymentDate: "2026-01-28",
        payPeriodStart: "2026-01-21",
        payPeriodEnd: "2026-01-27",
        payFrequency: "weekly",
        employmentWeeks: 1,
      }),
    ]);
    assert.ok(report.missingPeriods.length > 0);
    assert.equal(report.consecutive, false);
  });
});

describe("tenure", () => {
  it("bands months and never treats user-declared as document-verified", () => {
    assert.equal(tenureMonthsFromStart("2024-01-15", "2026-09-14"), 31);
    assert.equal(tenureBandFromMonths(11), "0_1");
    assert.equal(tenureBandFromMonths(12), "1_3");
    assert.equal(tenureBandFromMonths(36), "3_5");
    assert.equal(tenureBandFromMonths(60), "5_plus");
    assert.equal(isDocumentVerifiedTenure("user_declared"), false);
    assert.equal(isDocumentVerifiedTenure("employment_contract"), true);
  });
});

describe("verified analysis", () => {
  it("needs three unique slips with periods", () => {
    const two = [
      slip({ id: "1", paymentDate: "2026-03-22", payPeriodStart: "2026-03-16", payPeriodEnd: "2026-03-22" }),
      slip({ id: "2", paymentDate: "2026-03-15", payPeriodStart: "2026-03-09", payPeriodEnd: "2026-03-15" }),
    ];
    const short = analyseLatestSet(two, profile());
    assert.equal(short.status, "need_more");
    assert.equal(short.verifiedLabel, null);

    const three = [
      ...two,
      slip({ id: "3", paymentDate: "2026-03-08", payPeriodStart: "2026-03-02", payPeriodEnd: "2026-03-08" }),
    ];
    const ready = analyseLatestSet(three, profile());
    assert.equal(ready.status, "verified");
    assert.equal(ready.verifiedLabel, "TruckPay Verified Analysis");
  });
});

describe("personal pay change", () => {
  it("explains hours and leaves an unexplained remainder", () => {
    const previous = slip({
      id: "old",
      paymentDate: "2026-03-15",
      payFrequency: "weekly",
      employmentWeeks: 1,
      basicHours: 46,
      basicRate: 20,
      basicPay: 920,
      grossPay: 1040,
    });
    const latest = slip({
      id: "new",
      paymentDate: "2026-03-22",
      payFrequency: "weekly",
      employmentWeeks: 1,
      basicHours: 41.5,
      basicRate: 20,
      basicPay: 830,
      grossPay: 914,
    });
    const report = compareLatestToRecent([latest, previous]);
    assert.equal(report?.deltaGross, -126);
    assert.equal(report?.hoursContribution, -90);
    assert.equal(report?.unexplainedRemainder, -36);
    assert.equal(
      report?.lines.some((line) => line.kind === "unexplained" && /cannot currently be explained/i.test(line.summary)),
      true,
    );
    assert.equal(report?.lines.some((line) => /\bis illegal\b|underpaid you/i.test(line.summary)), false);
  });
});

describe("company aggregation", () => {
  it("does not publish a median below three drivers and uses defined confidence", () => {
    assert.equal(
      payConfidence({ driverCount: 2, verifiedPayslipCount: 6, distinctPeriodCount: 2, published: false }),
      "low",
    );
    assert.equal(
      payConfidence({ driverCount: 3, verifiedPayslipCount: 9, distinctPeriodCount: 1, published: true }),
      "medium",
    );
    assert.equal(
      payConfidence({ driverCount: 10, verifiedPayslipCount: 15, distinctPeriodCount: 2, published: true }),
      "high",
    );

    const oneDriverSlips = [1, 2, 3].map((n) =>
      slip({
        id: `s${n}`,
        userId: "only",
        paymentDate: `2026-03-0${n}`,
        payPeriodStart: `2026-03-0${n}`,
        payPeriodEnd: `2026-03-0${n}`,
        payFrequency: "weekly",
        employmentWeeks: 1,
        basicRate: 21.5,
        basicHours: 46,
        grossPay: 1040,
      }),
    );
    const stats = companyPayStats("nolan", oneDriverSlips, [profile({ userId: "only" })], "2026-09-14");
    const band = stats.bands.find((item) => item.band === "1_3")!;
    assert.equal(band.published, false);
    assert.equal(band.medianObservedGrossWeekly, null);
    assert.equal(band.evidenceLevel, "payroll_verified");
    assert.equal(stats.confidence, "low");
  });
});
