import type { PayConfidence } from "@/lib/payroll/types";

/**
 * Company pay confidence is a labelled band, not a free-score.
 *
 * HIGH — 10+ drivers, 15+ verified payslips, and at least 2 distinct pay periods.
 * MEDIUM — 3+ drivers and 9+ verified payslips.
 * LOW — anything else, including cells that do not meet the median publish threshold.
 *
 * Publishing a median still requires 3 drivers in that cell. LOW + a published
 * median means the sample exists but is not treated as representative.
 */
export function payConfidence(args: {
  driverCount: number;
  verifiedPayslipCount: number;
  distinctPeriodCount: number;
  published: boolean;
}): PayConfidence {
  if (!args.published) return "low";
  if (args.driverCount >= 10 && args.verifiedPayslipCount >= 15 && args.distinctPeriodCount >= 2) {
    return "high";
  }
  if (args.driverCount >= 3 && args.verifiedPayslipCount >= 9) return "medium";
  return "low";
}

export function confidenceRuleText(level: PayConfidence): string {
  if (level === "high") {
    return "High: 10 or more drivers, 15 or more verified payslips, covering more than one pay period.";
  }
  if (level === "medium") {
    return "Medium: 3 or more drivers and 9 or more verified payslips.";
  }
  return "Low: fewer drivers, fewer slips, a single period, or a cell below the publish threshold.";
}
