import type { TenureBandStats } from "@/lib/payroll/company-stats";
import type { Epistemic } from "@/lib/payroll/types";

export type PayFactor = {
  factor: "base_hourly_rate" | "normal_hours";
  epistemic: Epistemic;
  summary: string;
  yours: number | null;
  peerMedian: number | null;
};

/**
 * Neutral explanations only. Different pay at the same employer is not treated as
 * equivalent work, and is never worded as employer wrongdoing.
 */
export function explainPayDifferences(args: {
  ownRate: number | null;
  ownWeeklyHours: number | null;
  ownWeeklyGross: number | null;
  band: TenureBandStats | null;
  jobNote: string;
}): PayFactor[] {
  const factors: PayFactor[] = [];
  const band = args.band;

  if (args.ownRate != null && band?.published && band.medianBaseHourlyRate != null) {
    const delta = args.ownRate - band.medianBaseHourlyRate;
    factors.push({
      factor: "base_hourly_rate",
      epistemic: "inference",
      yours: args.ownRate,
      peerMedian: band.medianBaseHourlyRate,
      summary:
        Math.abs(delta) < 0.05
          ? `Your basic hourly rate matches the median in the ${band.label} band at this firm. That does not mean the work is the same (${args.jobNote}).`
          : `Your basic hourly rate is ${delta > 0 ? "above" : "below"} the median in the ${band.label} band. Rate differences are one possible contributor to different take-home. They are not proof of an error, and two drivers here may not do equivalent work (${args.jobNote}).`,
    });
  } else {
    factors.push({
      factor: "base_hourly_rate",
      epistemic: "unknown",
      yours: args.ownRate,
      peerMedian: band?.published ? band.medianBaseHourlyRate : null,
      summary:
        "Not enough verified peers in your tenure band to compare basic hourly rate, or your rate was not on the slips.",
    });
  }

  if (args.ownWeeklyHours != null && args.ownWeeklyGross != null) {
    factors.push({
      factor: "normal_hours",
      epistemic: args.ownWeeklyHours != null ? "fact" : "unknown",
      yours: args.ownWeeklyHours,
      peerMedian: null,
      summary: `On these slips, weekly-equivalent basic hours are ${args.ownWeeklyHours}. Hours (not just the hourly rate) change gross. A longer period on one slip is not treated as a single week.`,
    });
  } else {
    factors.push({
      factor: "normal_hours",
      epistemic: "unknown",
      yours: null,
      peerMedian: null,
      summary: "Normal hours could not be turned into a weekly equivalent without assuming one slip is one week.",
    });
  }

  return factors;
}
