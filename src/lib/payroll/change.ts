import type { Epistemic, Payslip } from "@/lib/payroll/types";
import { median, round2, weeklyEquivalentGross, weeklyEquivalentHours, weeklyMethod } from "@/lib/payroll/weekly";

export type PayChangeLine = {
  kind: "gross_delta" | "hours" | "unexplained" | "rate" | "new_deduction";
  epistemic: Epistemic;
  confidence: number;
  summary: string;
  amount: number | null;
};

export type PayChangeReport = {
  latestPayslipId: string;
  priorCount: number;
  weeklyEquivLatestGross: number | null;
  weeklyEquivRecentMedianGross: number | null;
  deltaGross: number | null;
  hoursContribution: number | null;
  unexplainedRemainder: number | null;
  lines: PayChangeLine[];
};

/**
 * Compare the newest slip to the median of earlier slips for the same employer.
 * Weekly equivalents never assume one slip is one week. Unexplained remainder is
 * left unexplained — never filled with a guessed cause or an accusation.
 */
export function compareLatestToRecent(slips: Payslip[]): PayChangeReport | null {
  const sorted = [...slips].sort(
    (a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.createdAt.localeCompare(a.createdAt),
  );
  const latest = sorted[0];
  if (!latest) return null;
  const prior = sorted.filter(
    (slip) => slip.id !== latest.id && (!latest.employerSlug || slip.employerSlug === latest.employerSlug),
  );
  if (prior.length === 0) return null;

  const latestWeekly = weeklyEquivalentGross(latest);
  const priorWeeklies = prior
    .map(weeklyEquivalentGross)
    .filter((value): value is number => value != null);
  const recentMedian = median(priorWeeklies);
  const delta =
    latestWeekly != null && recentMedian != null ? round2(latestWeekly - recentMedian) : null;

  const latestHours = weeklyEquivalentHours(latest);
  const priorHours = median(
    prior.map(weeklyEquivalentHours).filter((value): value is number => value != null),
  );
  const rate = latest.basicRate;
  const method = weeklyMethod(latest);
  const hoursAreFact = method === "insurable_weeks";
  let hoursContribution: number | null = null;
  if (latestHours != null && priorHours != null && rate != null) {
    hoursContribution = round2((latestHours - priorHours) * rate);
  }

  const unexplained =
    delta != null && hoursContribution != null ? round2(delta - hoursContribution) : delta;

  const lines: PayChangeLine[] = [];

  if (delta != null && latestWeekly != null && recentMedian != null) {
    const direction = delta === 0 ? "the same as" : delta > 0 ? "above" : "below";
    lines.push({
      kind: "gross_delta",
      epistemic: method === "unknown" ? "unknown" : hoursAreFact ? "fact" : "inference",
      confidence: hoursAreFact ? 0.85 : method === "unknown" ? 0.3 : 0.65,
      amount: delta,
      summary:
        method === "unknown"
          ? "This slip cannot be turned into a weekly equivalent without assuming it is one working week, so the change versus earlier slips is unknown."
          : `On a weekly-equivalent basis this slip is ${euro(Math.abs(delta))} ${direction} your recent median from ${prior.length} earlier slip${prior.length === 1 ? "" : "s"} (${euro(latestWeekly)} vs ${euro(recentMedian)}). That is a difference on the figures, not a finding of underpayment.`,
    });
  } else {
    lines.push({
      kind: "gross_delta",
      epistemic: "unknown",
      confidence: 0.2,
      amount: null,
      summary:
        "Not enough gross figures on this slip and earlier slips to compare weekly equivalents. TruckPay will not invent the missing numbers.",
    });
  }

  if (hoursContribution != null && latestHours != null && priorHours != null) {
    const fewer = hoursContribution < 0;
    lines.push({
      kind: "hours",
      epistemic: hoursAreFact ? "fact" : "inference",
      confidence: hoursAreFact ? 0.85 : 0.6,
      amount: hoursContribution,
      summary: `${euro(Math.abs(hoursContribution))} is explained by ${fewer ? "fewer" : "more"} paid basic hours on a weekly-equivalent basis (${latestHours} vs ${priorHours} hours × ${euro(rate!)} on this slip). Hours are taken from the slip; a longer period is not treated as one week.`,
    });
  } else {
    lines.push({
      kind: "hours",
      epistemic: "unknown",
      confidence: 0.2,
      amount: null,
      summary:
        "Hours cannot currently explain the change: basic hours or the basic rate were missing, or could not be turned into a weekly equivalent without assuming one slip is one week.",
    });
  }

  if (unexplained != null && Math.abs(unexplained) >= 0.05) {
    lines.push({
      kind: "unexplained",
      epistemic: "unknown",
      confidence: 0.4,
      amount: unexplained,
      summary: `${euro(Math.abs(unexplained))} cannot currently be explained from hours and the basic rate. TruckPay does not invent a cause, and does not treat an unexplained remainder as employer wrongdoing.`,
    });
  } else if (delta != null && hoursContribution != null) {
    lines.push({
      kind: "unexplained",
      epistemic: "inference",
      confidence: 0.5,
      amount: 0,
      summary:
        "After hours × basic rate, nothing material remains unexplained on a weekly-equivalent basis. Other lines (overtime, allowances, deductions) were not used as invented causes.",
    });
  }

  const last = prior[0];
  if (last && last.basicRate != null && latest.basicRate != null && last.basicRate !== latest.basicRate) {
    lines.push({
      kind: "rate",
      epistemic: "fact",
      confidence: 0.9,
      amount: round2(latest.basicRate - last.basicRate),
      summary: `The basic hourly rate on this slip (${euro(latest.basicRate)}) differs from the previous slip (${euro(last.basicRate)}). Rate changes happen for many lawful reasons; this is a difference, not an accusation.`,
    });
  }

  if (last) {
    const priorLabels = new Set(last.deductions.map((line) => line.rawLabel.trim().toLowerCase()));
    for (const line of latest.deductions) {
      const key = line.rawLabel.trim().toLowerCase();
      if (!key || priorLabels.has(key)) continue;
      if (line.normalizedCategory === "PAYE" || line.normalizedCategory === "PRSI" || line.normalizedCategory === "USC") {
        continue;
      }
      lines.push({
        kind: "new_deduction",
        epistemic: "fact",
        confidence: 0.8,
        amount: line.amount,
        summary: `“${line.rawLabel}” did not appear on the previous slip for this employer. It is flagged as new so you can check it. A new line is not classified as illegal.`,
      });
    }
  }

  return {
    latestPayslipId: latest.id,
    priorCount: prior.length,
    weeklyEquivLatestGross: latestWeekly,
    weeklyEquivRecentMedianGross: recentMedian,
    deltaGross: delta,
    hoursContribution,
    unexplainedRemainder: unexplained,
    lines,
  };
}

function euro(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
