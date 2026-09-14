import { payConfidence } from "@/lib/payroll/confidence";
import { refreshTenure } from "@/lib/payroll/profile";
import { analyseLatestSet } from "@/lib/payroll/analysis";
import type {
  EmploymentProfile,
  EvidenceLevel,
  JobType,
  PayConfidence,
  Payslip,
  ShiftType,
  TenureBand,
  TimeFraction,
  VehicleType,
} from "@/lib/payroll/types";
import { TENURE_BAND_LABELS } from "@/lib/payroll/types";
import { median, weeklyEquivalentGross, weeklyEquivalentHours } from "@/lib/payroll/weekly";

const PUBLISH_MIN_DRIVERS = 3;

export type TenureBandStats = {
  band: TenureBand;
  label: string;
  evidenceLevel: EvidenceLevel;
  confidence: PayConfidence;
  medianObservedGrossWeekly: number | null;
  medianBaseHourlyRate: number | null;
  medianPaidHoursWeekly: number | null;
  driverCount: number;
  verifiedPayslipCount: number;
  distinctPeriodCount: number;
  published: boolean;
  sampleNote: string;
};

export type ContextualSlice = {
  jobType: JobType;
  vehicleType: VehicleType;
  shiftType: ShiftType;
  timeFraction: TimeFraction;
  tenureBand: TenureBand;
  evidenceLevel: EvidenceLevel;
  confidence: PayConfidence;
  medianBaseHourlyRate: number | null;
  medianGrossWeekly: number | null;
  medianPaidHoursWeekly: number | null;
  driverCount: number;
  verifiedPayslipCount: number;
  published: boolean;
  sampleNote: string;
};

export type CompanyPayStats = {
  employerSlug: string;
  evidenceLevel: EvidenceLevel;
  confidence: PayConfidence;
  bands: TenureBandStats[];
  slices: ContextualSlice[];
  headline: string;
  disclaimer: string;
};

type Profile = EmploymentProfile;

type Bucket = {
  weekly: number[];
  rates: number[];
  hours: number[];
  drivers: number;
  slips: number;
  periods: Set<string>;
};

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

  const buckets: Record<TenureBand, Bucket> = {
    "0_1": emptyBucket(),
    "1_3": emptyBucket(),
    "3_5": emptyBucket(),
    "5_plus": emptyBucket(),
  };
  const sliceMap = new Map<string, Bucket & SliceDims>();

  let drivers = 0;
  let slips = 0;
  const allPeriods = new Set<string>();

  for (const [userId, userSlips] of byUser) {
    const profile = refreshTenure(
      profiles.find((item) => item.userId === userId) ?? emptyProfile(userId, employerSlug),
      asOf,
    );
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
    if (analysis.ownMedianWeeklyHours != null) bucket.hours.push(analysis.ownMedianWeeklyHours);
    for (const slip of analysis.latest) {
      const period = slip.payPeriodStart && slip.payPeriodEnd
        ? `${slip.payPeriodStart}:${slip.payPeriodEnd}`
        : slip.paymentDate;
      bucket.periods.add(period);
      allPeriods.add(period);
      const weekly = weeklyEquivalentGross(slip);
      if (weekly != null && analysis.ownMedianWeeklyGross == null) bucket.weekly.push(weekly);
      const hours = weeklyEquivalentHours(slip);
      if (hours != null && analysis.ownMedianWeeklyHours == null) bucket.hours.push(hours);
    }

    const dims: SliceDims = {
      jobType: profile.jobType,
      vehicleType: profile.vehicleType,
      shiftType: profile.shiftType,
      timeFraction: profile.timeFraction,
      tenureBand: band,
    };
    const key = sliceKey(dims);
    const slice = sliceMap.get(key) ?? { ...emptyBucket(), ...dims };
    slice.drivers += 1;
    slice.slips += analysis.latest.length;
    if (analysis.ownMedianWeeklyGross != null) slice.weekly.push(analysis.ownMedianWeeklyGross);
    if (analysis.ownMedianBaseRate != null) slice.rates.push(analysis.ownMedianBaseRate);
    if (analysis.ownMedianWeeklyHours != null) slice.hours.push(analysis.ownMedianWeeklyHours);
    for (const slip of analysis.latest) {
      const period = slip.payPeriodStart && slip.payPeriodEnd
        ? `${slip.payPeriodStart}:${slip.payPeriodEnd}`
        : slip.paymentDate;
      slice.periods.add(period);
    }
    sliceMap.set(key, slice);
  }

  const bands: TenureBandStats[] = (Object.keys(buckets) as TenureBand[]).map((band) => {
    const bucket = buckets[band];
    const published = bucket.drivers >= PUBLISH_MIN_DRIVERS;
    const confidence = payConfidence({
      driverCount: bucket.drivers,
      verifiedPayslipCount: bucket.slips,
      distinctPeriodCount: bucket.periods.size,
      published,
    });
    const sampleNote = `Based on ${bucket.drivers} driver${bucket.drivers === 1 ? "" : "s"} and ${bucket.slips} verified payslip${bucket.slips === 1 ? "" : "s"}.`;
    return {
      band,
      label: TENURE_BAND_LABELS[band],
      evidenceLevel: "payroll_verified" as const,
      confidence,
      medianObservedGrossWeekly: published ? median(bucket.weekly) : null,
      medianBaseHourlyRate: published ? median(bucket.rates) : null,
      medianPaidHoursWeekly: published ? median(bucket.hours) : null,
      driverCount: bucket.drivers,
      verifiedPayslipCount: bucket.slips,
      distinctPeriodCount: bucket.periods.size,
      published,
      sampleNote: published
        ? `${sampleNote} Median of weekly-equivalent figures (not “the company salary”). Small samples are not statistically representative.`
        : `${sampleNote} Too few drivers in this tenure band to publish a median.`,
    };
  });

  const slices: ContextualSlice[] = [...sliceMap.values()]
    .filter((slice) => slice.drivers > 0)
    .map((slice) => {
      const published = slice.drivers >= PUBLISH_MIN_DRIVERS;
      const confidence = payConfidence({
        driverCount: slice.drivers,
        verifiedPayslipCount: slice.slips,
        distinctPeriodCount: slice.periods.size,
        published,
      });
      return {
        jobType: slice.jobType,
        vehicleType: slice.vehicleType,
        shiftType: slice.shiftType,
        timeFraction: slice.timeFraction,
        tenureBand: slice.tenureBand,
        evidenceLevel: "payroll_verified" as const,
        confidence,
        medianBaseHourlyRate: published ? median(slice.rates) : null,
        medianGrossWeekly: published ? median(slice.weekly) : null,
        medianPaidHoursWeekly: published ? median(slice.hours) : null,
        driverCount: slice.drivers,
        verifiedPayslipCount: slice.slips,
        published,
        sampleNote: published
          ? `Based on ${slice.drivers} drivers and ${slice.slips} verified payslips in this job/vehicle/shift/tenure slice.`
          : `Based on ${slice.drivers} driver${slice.drivers === 1 ? "" : "s"} in this slice — median not published.`,
      };
    })
    .sort((a, b) => b.driverCount - a.driverCount);

  const overallPublished = drivers >= PUBLISH_MIN_DRIVERS;
  const overallConfidence = payConfidence({
    driverCount: drivers,
    verifiedPayslipCount: slips,
    distinctPeriodCount: allPeriods.size,
    published: overallPublished,
  });

  return {
    employerSlug,
    evidenceLevel: "payroll_verified",
    confidence: overallConfidence,
    bands,
    slices,
    headline:
      drivers === 0
        ? "No payroll-verified analysis for this firm yet."
        : `Payroll verified · ${drivers} driver${drivers === 1 ? "" : "s"} · ${slips} verified payslips · confidence ${overallConfidence}.`,
    disclaimer:
      "Payroll-verified figures are medians from TruckPay Verified Analysis (three unique slips). They are not driver-reported weekly stubs, and not a single company salary. Two drivers at the same firm may not do equivalent work.",
  };
}

type SliceDims = {
  jobType: JobType;
  vehicleType: VehicleType;
  shiftType: ShiftType;
  timeFraction: TimeFraction;
  tenureBand: TenureBand;
};

function sliceKey(dims: SliceDims): string {
  return [dims.jobType, dims.vehicleType, dims.shiftType, dims.timeFraction, dims.tenureBand].join("|");
}

function emptyBucket(): Bucket {
  return { weekly: [], rates: [], hours: [], drivers: 0, slips: 0, periods: new Set() };
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
