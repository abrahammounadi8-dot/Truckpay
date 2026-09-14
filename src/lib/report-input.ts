import { fleet } from "@/lib/data";
import type { DriverReport, Equipment, Operation, PayType } from "@/lib/types";

const PAY_TYPES: PayType[] = ["hourly", "day", "salary", "percentage"];
const EQUIPMENT: Equipment[] = ["curtain", "reefer", "flatbed", "tanker", "specialized"];
const OPERATIONS: Operation[] = ["domestic", "uk", "europe"];

export type ReportInput = {
  companySlug: string;
  role: string;
  tenure: string;
  payType: PayType;
  equipment: Equipment;
  operation: Operation;
  quotedWeekly?: number;
  hourlyRate?: number;
  weeklyPay: number;
  kmPerWeek?: number;
  hoursPerWeek: number;
  body: string;
};

export function parseReportInput(raw: unknown): { report?: ReportInput; error?: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "Send a JSON wage slip." };
  }
  const body = raw as Record<string, unknown>;
  const companySlug = asString(body.companySlug);
  if (!fleet.some((company) => company.slug === companySlug)) {
    return { error: "Pick a haulier on the board." };
  }

  const weeklyPay = Number(body.weeklyPay);
  if (!Number.isFinite(weeklyPay) || weeklyPay <= 0 || weeklyPay > 20000) {
    return { error: "Weekly take-home has to be a euro amount." };
  }

  const hoursPerWeek = Number(body.hoursPerWeek);
  if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 90) {
    return { error: "Hours per week has to be a real number." };
  }

  const quotedWeekly = optionalNumber(body.quotedWeekly, 20000);
  const hourlyRate = optionalNumber(body.hourlyRate, 80);
  const kmPerWeek = optionalNumber(body.kmPerWeek, 10000);
  if (quotedWeekly === false || hourlyRate === false || kmPerWeek === false) {
    return { error: "Quoted pay, hourly rate, and km have to be real numbers if you fill them in." };
  }

  const payType = PAY_TYPES.includes(body.payType as PayType)
    ? (body.payType as PayType)
    : "hourly";
  const equipment = EQUIPMENT.includes(body.equipment as Equipment)
    ? (body.equipment as Equipment)
    : "curtain";
  const operation = OPERATIONS.includes(body.operation as Operation)
    ? (body.operation as Operation)
    : "domestic";

  return {
    report: {
      companySlug,
      role: asString(body.role).slice(0, 80) || "HGV driver",
      tenure: asString(body.tenure).slice(0, 40) || "1–2 years",
      payType,
      equipment,
      operation,
      quotedWeekly,
      hourlyRate,
      weeklyPay: Math.round(weeklyPay),
      kmPerWeek,
      hoursPerWeek: Math.round(hoursPerWeek),
      body: asString(body.body).slice(0, 4000),
    },
  };
}

export function toStoredReport(input: ReportInput): DriverReport {
  return {
    id: `rpt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    submittedAt: new Date().toISOString().slice(0, 10),
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: unknown, max: number): number | undefined | false {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > max) return false;
  return parsed;
}
