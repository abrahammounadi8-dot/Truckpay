import { REQUIRED_PAYSLIPS, type AnalysisStatus, type EmploymentProfile, type Payslip } from "@/lib/payroll/types";
import { inspectSequence, type SequenceReport } from "@/lib/payroll/sequence";
import { weeklyEquivalentGross, weeklyEquivalentHours, median } from "@/lib/payroll/weekly";
import { isDocumentVerifiedTenure } from "@/lib/payroll/tenure";

export type SetAnalysis = {
  status: AnalysisStatus;
  verifiedLabel: "TruckPay Verified Analysis" | null;
  required: number;
  have: number;
  latest: Payslip[];
  sequence: SequenceReport;
  blockers: string[];
  warnings: string[];
  ownMedianWeeklyGross: number | null;
  ownMedianWeeklyHours: number | null;
  ownMedianBaseRate: number | null;
};

export function analyseLatestSet(all: Payslip[], profile: EmploymentProfile | null): SetAnalysis {
  const latest = [...all]
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, REQUIRED_PAYSLIPS);

  const sequence = inspectSequence(latest);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (latest.length < REQUIRED_PAYSLIPS) {
    blockers.push(
      `TruckPay Verified Analysis needs your latest ${REQUIRED_PAYSLIPS} payslips. You have ${latest.length}.`,
    );
  }
  if (sequence.mixedEmployer) {
    blockers.push("The latest slips are linked to more than one employer. Use the current employer on each slip.");
  }
  const employer = profile?.employerSlug ?? uniqueEmployer(latest);
  if (latest.length >= REQUIRED_PAYSLIPS && !employer) {
    blockers.push("Link the slips to the current employer so they can be analysed as one job.");
  }
  if (latest.length >= REQUIRED_PAYSLIPS && !sequence.periodsExtracted) {
    blockers.push("Each of the three slips needs a pay period start and end as printed. One slip is not assumed to be one week.");
  }

  if (sequence.missingPeriods.length) {
    warnings.push(
      `There appears to be a gap between ${sequence.missingPeriods[0]!.afterEnd} and ${sequence.missingPeriods[0]!.beforeStart}. Missing periods are flagged; they are not treated as a single week.`,
    );
  }
  if (profile?.tenureSource === "user_declared") {
    warnings.push("Employment start date is what you told us. It is not document-verified.");
  } else if (profile?.tenureSource && isDocumentVerifiedTenure(profile.tenureSource)) {
    /* document source is fine */
  }

  const ready = latest.length >= REQUIRED_PAYSLIPS && blockers.length === 0;
  const status: AnalysisStatus = latest.length < REQUIRED_PAYSLIPS ? "need_more" : ready ? "verified" : "incomplete";

  const weeklyGross = latest.map(weeklyEquivalentGross).filter((value): value is number => value != null);
  const weeklyHours = latest.map(weeklyEquivalentHours).filter((value): value is number => value != null);
  const rates = latest.map((slip) => slip.basicRate).filter((value): value is number => value != null);

  return {
    status,
    verifiedLabel: status === "verified" ? "TruckPay Verified Analysis" : null,
    required: REQUIRED_PAYSLIPS,
    have: latest.length,
    latest,
    sequence,
    blockers,
    warnings,
    ownMedianWeeklyGross: median(weeklyGross),
    ownMedianWeeklyHours: median(weeklyHours),
    ownMedianBaseRate: median(rates),
  };
}

function uniqueEmployer(slips: Payslip[]): string | null {
  const set = new Set(slips.map((slip) => slip.employerSlug).filter((value): value is string => Boolean(value)));
  return set.size === 1 ? [...set][0]! : null;
}
