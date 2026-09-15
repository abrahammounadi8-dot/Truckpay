import { resolveEmployer } from "@/lib/payroll/employer";
import {
  isDocumentVerifiedTenure,
  tenureBandFromMonths,
  tenureConfidence,
  tenureMonthsFromStart,
} from "@/lib/payroll/tenure";
import type {
  CountryCode,
  EmploymentProfile,
  JobType,
  ShiftType,
  TenureSource,
  TimeFraction,
  VehicleType,
} from "@/lib/payroll/types";
import type { PayType } from "@/lib/types";

const JOBS: JobType[] = ["distribution", "trunking", "specialised", "other"];
const VEHICLES: VehicleType[] = [
  "articulated",
  "rigid",
  "tanker",
  "fuel",
  "refrigerated",
  "container",
  "specialised",
  "unknown",
];
const SHIFTS: ShiftType[] = ["day", "night", "rotating", "mixed"];
const TIMES: TimeFraction[] = ["full_time", "part_time"];
const PAY: PayType[] = ["hourly", "day", "salary", "percentage"];
const SOURCES: TenureSource[] = [
  "payslip",
  "employment_contract",
  "user_declared",
  "other_verified_document",
];

export type ProfileInput = {
  employerSlug?: string | null;
  employerName?: string | null;
  employmentStartDate?: string | null;
  tenureSource?: TenureSource | null;
  jobType?: JobType;
  vehicleType?: VehicleType;
  timeFraction?: TimeFraction;
  shiftType?: ShiftType;
  payType?: PayType;
  agreedBaseRate?: number | null;
};

export function parseProfileInput(raw: unknown): { input?: ProfileInput; error?: string } {
  if (!raw || typeof raw !== "object") return { error: "Send a JSON profile." };
  const body = raw as Record<string, unknown>;
  const named = asString(body.employerName) || asString(body.employerSlug);
  const employer = resolveEmployer(named);
  const employmentStartDate = asDate(body.employmentStartDate);
  const tenureSource = SOURCES.includes(body.tenureSource as TenureSource)
    ? (body.tenureSource as TenureSource)
    : employmentStartDate
      ? "user_declared"
      : null;
  if (employmentStartDate && !tenureSource) {
    return { error: "Say where the start date came from." };
  }

  const agreed = optionalNumber(body.agreedBaseRate, 200);
  if (agreed === false) return { error: "Agreed base rate has to be a euro amount if filled in." };

  return {
    input: {
      employerSlug: employer.employerSlug,
      employerName: employer.employerName,
      employmentStartDate,
      tenureSource,
      jobType: JOBS.includes(body.jobType as JobType) ? (body.jobType as JobType) : "other",
      vehicleType: VEHICLES.includes(body.vehicleType as VehicleType)
        ? (body.vehicleType as VehicleType)
        : "unknown",
      timeFraction: TIMES.includes(body.timeFraction as TimeFraction)
        ? (body.timeFraction as TimeFraction)
        : "full_time",
      shiftType: SHIFTS.includes(body.shiftType as ShiftType) ? (body.shiftType as ShiftType) : "mixed",
      payType: PAY.includes(body.payType as PayType) ? (body.payType as PayType) : "hourly",
      agreedBaseRate: agreed ?? null,
    },
  };
}

export function toStoredProfile(userId: string, input: ProfileInput, asOf: string): EmploymentProfile {
  const start = input.employmentStartDate ?? null;
  const source = start ? (input.tenureSource ?? "user_declared") : null;
  const months = start ? tenureMonthsFromStart(start, asOf) : null;
  return {
    userId,
    employerSlug: input.employerSlug ?? null,
    employerName: input.employerName ?? null,
    employmentStartDate: start,
    tenureMonths: months,
    tenureBand: months != null ? tenureBandFromMonths(months) : null,
    tenureSource: source,
    tenureConfidence: tenureConfidence(source),
    jobType: input.jobType ?? "other",
    vehicleType: input.vehicleType ?? "unknown",
    timeFraction: input.timeFraction ?? "full_time",
    shiftType: input.shiftType ?? "mixed",
    payType: input.payType ?? "hourly",
    agreedBaseRate: input.agreedBaseRate ?? null,
    countryCode: "IE" as CountryCode,
    updatedAt: new Date().toISOString(),
  };
}

export function refreshTenure(profile: EmploymentProfile, asOf: string): EmploymentProfile {
  if (!profile.employmentStartDate) return profile;
  const months = tenureMonthsFromStart(profile.employmentStartDate, asOf);
  return {
    ...profile,
    tenureMonths: months,
    tenureBand: tenureBandFromMonths(months),
    tenureConfidence: tenureConfidence(profile.tenureSource),
    updatedAt: profile.updatedAt,
  };
}

export { isDocumentVerifiedTenure };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asDate(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return Number.isFinite(Date.parse(text)) ? text : null;
}

function optionalNumber(value: unknown, max: number): number | null | false {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) return false;
  return Math.round(parsed * 100) / 100;
}
