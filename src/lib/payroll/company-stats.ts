import { refreshTenure } from "@/lib/payroll/profile";
import { analyseLatestSet } from "@/lib/payroll/analysis";
import type { EmploymentProfile, Payslip, TenureBand } from "@/lib/payroll/types";
import { TENURE_BAND_LABELS } from "@/lib/payroll/types";
import { median, weeklyEquivalentGross } from "@/lib/payroll/weekly";

const PUBLISH_MIN_DRIVERS = 3;

export type TenureBandStats = {
  band: TenureBand;
  label: string;
  medianObservedGrossWeekly: number | null;
  medianBaseHourlyRate: number | null;
  driverCount: number;
  verifiedPayslipCount: number;
  published: boolean;
  sampleNote: string;
};

export type CompanyPayStats = {
  employerSlug: string;
  bands: TenureBandStats[];
  headline: string;
  disclaimer: string;
};

type Profile = EmploymentProfile;

export function companyPayStats(
  employerSlug: string,
  allPayslips: Payslip[],
  profiles: Profile[],
  asOf: string,
): CompanyPayStats {
  const byUser = new Map<string, Payslip[]>();
  for (const slip of allPayslips.filter((item) => item.employerSlug === employerSlug)) {
    const list = byUser.get(slip.userId) ?? [];
    list.push(slip);
    byUser.set(slip.userId, list);
  }

  const buckets: Record<TenureBand, { weekly: number[]; rates: number[]; drivers: number; slips: number }> = {
    "0_1": { weekly: [], rates: [], drivers: 0, slips: 0 },
    "1_3": { weekly: [], rates: [], drivers: 0, slips: 0 },
    "3_5": { weekly: [], rates: [], drivers: 0, slips: 0 },
    "5_plus": { weekly: [], rates: [], drivers: 0, slips: 0 },
  };

  let drivers = 0;
  let slips = 0;

  for (const [userId, userSlips] of byUser) {
    const profile = refreshTenure(profiles.find((item) => item.userId === userId) ?? emptyProfile(userId, employerSlug), asOf);
    const analysis = analyseLatestSet(userSlips, profile);
    if (analysis.status !== "verified") continue;
    const band = profile.tenureBand;
    if (!band) continue;
    drivers += 1;
    slips += analysis.latest.length;
    const bucket = buckets[band];
    bucket.drivers += 1;
    bucket.slips += analysis.latest.length;
    if (analysis.ownMedianWeeklyGross != null) bucket.weekly.push(analysis.ownMedianWeeklyGross);
    if (analysis.ownMedianBaseRate != null) bucket.rates.push(analysis.ownMedianBaseRate);
    for (const slip of analysis.latest) {
      const weekly = weeklyEquivalentGross(slip);
      if (weekly != null && analysis.ownMedianWeeklyGross == null) bucket.weekly.push(weekly);
    }
  }

  const bands: TenureBandStats[] = (Object.keys(buckets) as TenureBand[]).map((band) => {
    const bucket = buckets[band];
    const published = bucket.drivers >= PUBLISH_MIN_DRIVERS;
    const sampleNote = `Based on ${bucket.drivers} driver${bucket.drivers === 1 ? "" : "s"} and ${bucket.slips} verified payslip${bucket.slips === 1 ? "" : "s"}.`;
    return {
      band,
      label: TENURE_BAND_LABELS[band],
      medianObservedGrossWeekly: published ? median(bucket.weekly) : null,
      medianBaseHourlyRate: published ? median(bucket.rates) : null,
      driverCount: bucket.drivers,
      verifiedPayslipCount: bucket.slips,
      published,
      sampleNote: published
        ? `${sampleNote} Median of weekly-equivalent gross (not “the company salary”). Small samples are not statistically representative.`
        : `${sampleNote} Too few drivers in this tenure band to publish a median.`,
    };
  });

  return {
    employerSlug,
    bands,
    headline:
      drivers === 0
        ? "No TruckPay Verified Analysis for this firm yet."
        : `Based on ${drivers} driver${drivers === 1 ? "" : "s"} and ${slips} verified payslips.`,
    disclaimer:
      "Figures are medians of weekly-equivalent gross from verified three-slip sets. They are not a single company salary. Two drivers at the same firm may not do equivalent work (vehicle, shift, hours).",
  };
}

function emptyProfile(userId: string, employerSlug: string): Profile {
  return {
    userId,
    employerSlug,
    employmentStartDate: null,
    tenureMonths: null,
    tenureBand: null,
    tenureSource: null,
    tenureConfidence: null,
    jobType: "other",
    vehicleType: "unknown",
    timeFraction: "full_time",
    shiftType: "mixed",
    payType: "hourly",
    agreedBaseRate: null,
    countryCode: "IE",
    updatedAt: "",
  };
}
