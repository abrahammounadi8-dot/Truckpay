import type { PayFrequency, Payslip } from "@/lib/payroll/types";

export type PeriodGap = {
  afterPayslipId: string;
  beforePayslipId: string;
  afterEnd: string;
  beforeStart: string;
  gapDays: number;
  expectedDays: number | null;
};

export type SequenceReport = {
  consecutive: boolean;
  consecutiveEpistemic: "fact" | "inference" | "unknown";
  missingPeriods: PeriodGap[];
  mixedEmployer: boolean;
  periodsExtracted: boolean;
};

function periodOf(slip: Payslip): { start: string; end: string; extracted: boolean } | null {
  if (slip.payPeriodStart && slip.payPeriodEnd) {
    return { start: slip.payPeriodStart, end: slip.payPeriodEnd, extracted: true };
  }
  return null;
}

function expectedLengthDays(frequency: PayFrequency, employmentWeeks: number | null): number | null {
  if (employmentWeeks && employmentWeeks > 0) return Math.round(employmentWeeks * 7);
  if (frequency === "weekly") return 7;
  if (frequency === "fortnightly") return 14;
  if (frequency === "lunar") return 28;
  if (frequency === "monthly") return 30;
  return null;
}

function daysBetween(endInclusive: string, nextStart: string): number {
  const a = Date.parse(endInclusive);
  const b = Date.parse(nextStart);
  return Math.round((b - a) / 86_400_000) - 1;
}

/** Oldest → newest by extracted period, else payment date. One slip is never treated as one week. */
export function inspectSequence(slips: Payslip[]): SequenceReport {
  const employers = new Set(slips.map((slip) => slip.employerSlug).filter(Boolean));
  const mixedEmployer = employers.size > 1;
  const dated = slips
    .map((slip) => ({ slip, period: periodOf(slip) }))
    .filter((row) => row.period != null) as {
    slip: Payslip;
    period: { start: string; end: string; extracted: boolean };
  }[];

  const periodsExtracted = dated.length === slips.length && slips.length > 0;
  if (dated.length < 2) {
    return {
      consecutive: dated.length === slips.length && slips.length > 0,
      consecutiveEpistemic: periodsExtracted ? "fact" : "unknown",
      missingPeriods: [],
      mixedEmployer,
      periodsExtracted,
    };
  }

  dated.sort((a, b) => a.period.start.localeCompare(b.period.start) || a.period.end.localeCompare(b.period.end));

  const missingPeriods: PeriodGap[] = [];
  for (let i = 0; i < dated.length - 1; i += 1) {
    const current = dated[i]!;
    const next = dated[i + 1]!;
    const gapDays = daysBetween(current.period.end, next.period.start);
    const expected =
      expectedLengthDays(next.slip.payFrequency, next.slip.employmentWeeks) ??
      expectedLengthDays(current.slip.payFrequency, current.slip.employmentWeeks);
    const overlapOrTouch = gapDays <= 2;
    const hole = expected != null ? gapDays > expected * 0.6 : gapDays > 10;
    if (!overlapOrTouch && hole) {
      missingPeriods.push({
        afterPayslipId: current.slip.id,
        beforePayslipId: next.slip.id,
        afterEnd: current.period.end,
        beforeStart: next.period.start,
        gapDays,
        expectedDays: expected,
      });
    }
  }

  return {
    consecutive: missingPeriods.length === 0,
    consecutiveEpistemic: periodsExtracted ? "fact" : "unknown",
    missingPeriods,
    mixedEmployer,
    periodsExtracted,
  };
}
