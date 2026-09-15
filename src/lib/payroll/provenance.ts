import { derivedField, sourceField, unverifiedField, type ProvenanceField } from "@/lib/payroll/field";
import type { Payslip, PayslipProvenance, YearToDateTotals } from "@/lib/payroll/types";

function sumCategory(slip: Payslip, category: Payslip["deductions"][number]["normalizedCategory"]): number | null {
  const lines = slip.deductions.filter((line) => line.normalizedCategory === category);
  if (lines.length === 0) return null;
  return round2(lines.reduce((sum, line) => sum + line.amount, 0));
}

function otherDeductionsTotal(slip: Payslip): number | null {
  const lines = slip.deductions.filter(
    (line) =>
      line.normalizedCategory !== "PAYE" &&
      line.normalizedCategory !== "PRSI" &&
      line.normalizedCategory !== "USC" &&
      line.normalizedCategory !== "PENSION",
  );
  if (lines.length === 0) return null;
  return round2(lines.reduce((sum, line) => sum + line.amount, 0));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildProvenance(slip: Payslip): PayslipProvenance {
  const tax = sumCategory(slip, "PAYE");
  const prsi = sumCategory(slip, "PRSI");
  const usc = sumCategory(slip, "USC");
  const pension = sumCategory(slip, "PENSION");
  const others = otherDeductionsTotal(slip);
  const allowanceTotal =
    slip.allowances.length === 0 ? null : round2(slip.allowances.reduce((sum, line) => sum + line.amount, 0));

  const ytd = yearToDate(slip);

  return {
    employer: sourceField(slip.employerName ?? slip.employerSlug),
    grossPay: sourceField(slip.grossPay),
    netPay: sourceField(slip.netPay),
    basicHours: sourceField(slip.basicHours),
    overtimeHours: sourceField(slip.overtimeHours),
    hourlyRate: sourceField(slip.basicRate),
    overtimeRate: sourceField(slip.overtimeRate),
    allowances: allowanceField(allowanceTotal),
    tax: classifiedMoney(tax, slip.deductions.filter((line) => line.normalizedCategory === "PAYE").length),
    prsi: classifiedMoney(prsi, slip.deductions.filter((line) => line.normalizedCategory === "PRSI").length),
    usc: classifiedMoney(usc, slip.deductions.filter((line) => line.normalizedCategory === "USC").length),
    pension: classifiedMoney(pension, slip.deductions.filter((line) => line.normalizedCategory === "PENSION").length),
    otherDeductions: classifiedMoney(others, others == null ? 0 : 2),
    holidayPay: sourceField(slip.holidayPay ?? null),
    weekNumber: weekNumberField(slip),
    payPeriodStart: sourceField(slip.payPeriodStart),
    payPeriodEnd: sourceField(slip.payPeriodEnd),
    yearToDate: ytd,
  };
}

function allowanceField(total: number | null): ProvenanceField<number> {
  if (total == null) return unverifiedField();
  return sourceField(total);
}

function classifiedMoney(total: number | null, matchingLines: number): ProvenanceField<number> {
  if (total == null) return unverifiedField();
  if (matchingLines === 1) return sourceField(total);
  return derivedField(total, 0.9);
}

function weekNumberField(slip: Payslip): ProvenanceField<number> {
  if (slip.weekNumber != null) return sourceField(slip.weekNumber);
  const assigned = slip.weekAssignment;
  if (assigned?.verification_status === "derived" && assigned.weekNumber != null) {
    return derivedField(assigned.weekNumber, assigned.confidence);
  }
  if (assigned?.verification_status === "needs_review") {
    return {
      value: assigned.weekNumber,
      source: assigned.weekNumber == null ? "unverified" : "source",
      derived: assigned.derived,
      confidence: assigned.confidence,
      verification_status: "needs_review",
    };
  }
  return unverifiedField();
}

function yearToDate(slip: Payslip): ProvenanceField<YearToDateTotals> {
  const totals: YearToDateTotals = {
    gross: slip.cumulativeGross ?? null,
    tax: slip.cumulativeTax ?? null,
    prsi: slip.cumulativePrsi ?? null,
    usc: slip.cumulativeUsc ?? null,
    pension: slip.cumulativePension ?? null,
    insurableWeeks: slip.totalInsurableWeeks ?? null,
  };
  const any = Object.values(totals).some((value) => value != null);
  if (!any) return unverifiedField();
  return sourceField(totals);
}
