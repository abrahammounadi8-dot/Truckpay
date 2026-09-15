import { detectPayslipAnomalies } from "@/lib/payroll/anomalies";
import { buildProvenance } from "@/lib/payroll/provenance";
import { classifyWorkWeek } from "@/lib/payroll/week";
import { buildWeeklyRecord } from "@/lib/payroll/weekly-record";
import type { Payslip } from "@/lib/payroll/types";

/** Attach week classification, provenance and weekly record. Never invent missing figures. */
export function attachProcessing(slip: Payslip): Payslip {
  const weekAssignment = classifyWorkWeek({
    countryCode: slip.countryCode,
    weekNumber: slip.weekNumber ?? null,
    paymentDate: slip.paymentDate,
    payPeriodStart: slip.payPeriodStart,
    payPeriodEnd: slip.payPeriodEnd,
    employmentWeeks: slip.employmentWeeks,
    payFrequency: slip.payFrequency,
  });
  const withWeek: Payslip = {
    ...slip,
    employerName: slip.employerName ?? null,
    weekNumber: slip.weekNumber ?? null,
    holidayPay: slip.holidayPay ?? null,
    cumulativePrsi: slip.cumulativePrsi ?? null,
    cumulativeUsc: slip.cumulativeUsc ?? null,
    cumulativePension: slip.cumulativePension ?? null,
    weekAssignment,
  };
  const provenance = buildProvenance(withWeek);
  const weeklyRecord = buildWeeklyRecord(withWeek, provenance);
  return {
    ...withWeek,
    provenance,
    weeklyRecord,
    reviewStatus:
      weekAssignment.verification_status === "needs_review" || slip.reviewStatus === "needs_review"
        ? "needs_review"
        : slip.reviewStatus,
  };
}

export function hydratePayslip(slip: Payslip): Payslip {
  return attachProcessing({
    ...slip,
    employerName: slip.employerName ?? null,
    weekNumber: slip.weekNumber ?? null,
    holidayPay: slip.holidayPay ?? null,
    cumulativePrsi: slip.cumulativePrsi ?? null,
    cumulativeUsc: slip.cumulativeUsc ?? null,
    cumulativePension: slip.cumulativePension ?? null,
  });
}

export function processingAnomalies(slip: Payslip, prior: Payslip[]) {
  return detectPayslipAnomalies(slip, prior, null);
}
