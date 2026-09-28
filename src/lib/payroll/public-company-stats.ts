import { analyseLatestSet } from "@/lib/payroll/analysis";
import { median } from "@/lib/payroll/weekly";
import type { EmploymentProfile, Payslip } from "@/lib/payroll/types";

// This is a publication threshold, not a claim that the result is anonymous.
const MIN_DRIVERS = 10;

export type PublicCompanyStats = {
  medianGrossWeekly: number | null;
  medianBaseHourlyRate: number | null;
  medianPaidHoursWeekly: number | null;
  sample: "10+ drivers";
};

/** Publish only company-wide medians; no exact counts, tenure bands or slices. */
export function publicCompanyStats(
  employerSlug: string,
  payslips: Payslip[],
  profiles: EmploymentProfile[],
): PublicCompanyStats | null {
  const grouped = new Map<string, Payslip[]>();
  for (const slip of payslips) {
    if (slip.employerSlug !== employerSlug) continue;
    grouped.set(slip.userId, [...(grouped.get(slip.userId) ?? []), slip]);
  }
  const gross: number[] = [];
  const rates: number[] = [];
  const hours: number[] = [];
  let eligible = 0;
  for (const [userId, userSlips] of grouped) {
    const profile = profiles.find((item) => item.userId === userId) ?? null;
    const analysis = analyseLatestSet(userSlips, profile);
    if (analysis.status !== "verified") continue;
    eligible += 1;
    if (analysis.ownMedianWeeklyGross != null) gross.push(analysis.ownMedianWeeklyGross);
    if (analysis.ownMedianBaseRate != null) rates.push(analysis.ownMedianBaseRate);
    if (analysis.ownMedianWeeklyHours != null) hours.push(analysis.ownMedianWeeklyHours);
  }
  if (eligible < MIN_DRIVERS) return null;
  return {
    medianGrossWeekly: gross.length >= MIN_DRIVERS ? median(gross) : null,
    medianBaseHourlyRate: rates.length >= MIN_DRIVERS ? median(rates) : null,
    medianPaidHoursWeekly: hours.length >= MIN_DRIVERS ? median(hours) : null,
    sample: "10+ drivers",
  };
}

/** Explicit opt-in only after privacy and deployment checks. */
export function publicCompanyStatsEnabled(): boolean {
  return process.env.PUBLIC_PAYROLL_STATS_ENABLED === "true";
}
