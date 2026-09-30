import { hasPublicPublicationConsent } from "./publication-consent";
import { payConfidence } from "@/lib/payroll/confidence";
import { consecutiveOnboarding } from "./onboarding";
import { employmentStartFor, validateEmploymentStart, profileAtPayslip } from "@/lib/payroll/employment-month";
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

const PUBLISH_MIN_DRIVERS = 1;

export type TenureBandStats = {
  netByFrequency: { frequency: string; medianNet: number; driverCount: number; payslipCount: number }[];
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
  netByFrequency: TenureBandStats["netByFrequency"];
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
  publicationStatus?: "active";
  driverCount: number;
  verifiedPayslipCount: number;
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
  nativeNet: Map<string, { values: number[]; drivers: number; slips: number }>;
  weekly: number[];
  rates: number[];
  hours: number[];
  drivers: number;
  slips: number;
  periods: Set<string>;
};

export function calculateCompanyPayStats(
  employerSlug: string,
  allPayslips: Payslip[],
  profiles: Profile[],
  asOf: string,
): CompanyPayStats {
  void asOf;
  const byUser = new Map<string, Payslip[]>();
  for (const slip of allPayslips.filter((item) => item.employerSlug === employerSlug && !item.manualAmountAudit)) {
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
    const sourceProfile = profiles.find(item => item.userId === userId) ?? emptyProfile(userId, employerSlug);
    const selected = analyseLatestSet(userSlips, null);
    const reference = selected.latest[0];
    if (!reference) continue;
    const profile = profileAtPayslip(sourceProfile, reference)!;
    const analysis = analyseLatestSet(userSlips, profile);
    if (analysis.status !== "verified") continue;
    const declaration = employmentStartFor(sourceProfile, employerSlug);
    if (!declaration || validateEmploymentStart(declaration.startMonth, employerSlug, userSlips)) continue;
    const unique = [...new Map(userSlips.map(slip => [slip.contentHash || slip.id, slip])).values()];
    const byBand = new Map<TenureBand, { slips: Payslip[]; profile: Profile }>();
    for (const slip of unique) {
      if (consecutiveOnboarding([slip]).have !== 1) continue;
      const atDate = profileAtPayslip(sourceProfile, slip);
      if (!atDate?.tenureBand) continue;
      const entry = byBand.get(atDate.tenureBand) ?? { slips: [], profile: atDate };
      entry.slips.push(slip); byBand.set(atDate.tenureBand, entry);
    }
    if (!byBand.size) continue;
    drivers += 1;
    for (const [band, entry] of byBand) {
      const records = entry.slips;
      slips += records.length;
      const bucket = buckets[band];
      bucket.drivers += 1; // Once per account and band, never once per document.
      bucket.slips += records.length;
      for (const frequency of new Set(records.map(s => s.payFrequency))) {
        const native = records.filter(s => s.payFrequency === frequency && s.netPay != null && Number.isFinite(s.netPay));
        const value = median(native.map(s => s.netPay!));
        if (value == null) continue;
        const group = bucket.nativeNet.get(frequency) ?? { values: [], drivers: 0, slips: 0 };
        group.values.push(value); group.drivers += 1; group.slips += native.length;
        bucket.nativeNet.set(frequency, group);
      }
      const gross = median(records.map(weeklyEquivalentGross).filter((v): v is number => v != null));
      const hours = median(records.map(weeklyEquivalentHours).filter((v): v is number => v != null));
      const rate = median(records.map(s => s.basicRate).filter((v): v is number => v != null));
      if (gross != null) bucket.weekly.push(gross);
      if (hours != null) bucket.hours.push(hours);
      if (rate != null) bucket.rates.push(rate);
      for (const slip of records) {
        const period = slip.payPeriodStart && slip.payPeriodEnd ? slip.payPeriodStart + ":" + slip.payPeriodEnd : slip.paymentDate;
        bucket.periods.add(period); allPeriods.add(period);
      }
      // Job/shift attributes from a different current employer are not reused for old jobs.
      if (sourceProfile.employerSlug !== employerSlug) continue;
      const dims: SliceDims = { jobType: entry.profile.jobType, vehicleType: entry.profile.vehicleType, shiftType: entry.profile.shiftType, timeFraction: entry.profile.timeFraction, tenureBand: band };
      const key = sliceKey(dims);
      const slice = sliceMap.get(key) ?? { ...emptyBucket(), ...dims };
      slice.drivers += 1; slice.slips += records.length;
      for (const frequency of new Set(records.map(s => s.payFrequency))) {
        const native = records.filter(s => s.payFrequency === frequency && s.netPay != null && Number.isFinite(s.netPay));
        const value = median(native.map(s => s.netPay!));
        if (value == null) continue;
        const group = slice.nativeNet.get(frequency) ?? { values: [], drivers: 0, slips: 0 };
        group.values.push(value); group.drivers += 1; group.slips += native.length;
        slice.nativeNet.set(frequency, group);
      }
      if (gross != null) slice.weekly.push(gross);
      if (hours != null) slice.hours.push(hours);
      if (rate != null) slice.rates.push(rate);
      for (const slip of records) slice.periods.add(slip.payPeriodStart && slip.payPeriodEnd ? slip.payPeriodStart + ":" + slip.payPeriodEnd : slip.paymentDate);
      sliceMap.set(key, slice);
    }
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
      netByFrequency: [...bucket.nativeNet].filter(([, group]) => group.drivers >= PUBLISH_MIN_DRIVERS).map(([frequency, group]) => ({ frequency, medianNet: median(group.values)!, driverCount: group.drivers, payslipCount: group.slips })),
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
        ? `${sampleNote} Net medians per payslip, separated by frequency (not “the company salary”). Small samples are not statistically representative.`
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
        netByFrequency: [...slice.nativeNet].map(([frequency, group]) => ({ frequency, medianNet: median(group.values)!, driverCount: group.drivers, payslipCount: group.slips })),
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
    driverCount: drivers,
    verifiedPayslipCount: slips,
    evidenceLevel: "payroll_verified",
    confidence: overallConfidence,
    bands,
    slices,
    headline:
      drivers === 0
        ? "No payroll-verified analysis for this firm yet."
        : `Payroll verified · ${drivers} driver${drivers === 1 ? "" : "s"} · ${slips} verified payslips · confidence ${overallConfidence}.`,
    disclaimer:
      "Payroll-verified figures are medians from MyTruckPay Verified Analysis (three unique slips). They are not driver-reported weekly stubs, and not a single company salary. Two drivers at the same firm may not do equivalent work.",
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
  return { nativeNet: new Map(), weekly: [], rates: [], hours: [], drivers: 0, slips: 0, periods: new Set() };
}

function emptyProfile(userId: string, employerSlug: string): Profile {
  return {
    userId,
    employerSlug,
    employerName: null,
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

/** Public output uses only accounts with current, explicit publication permission. */
export function companyPayStats(employerSlug: string, payslips: Payslip[], profiles: Profile[], asOf: string): CompanyPayStats {
  const allowed = profiles.filter(profile => hasPublicPublicationConsent(profile)
    && profiles.filter(other => other.userId === profile.userId).length === 1);
  const users = new Set(allowed.map(profile => profile.userId));
  return { ...calculateCompanyPayStats(employerSlug, payslips.filter(slip => users.has(slip.userId)), allowed, asOf), publicationStatus: "active" };
}
