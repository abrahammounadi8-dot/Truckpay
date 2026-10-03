import { createHash } from "node:crypto";
import { marketFrom, isMarket } from "./markets";
import { spanishCompanies } from "./spanish-companies";
import { fleet } from "@/lib/data";
import type { DriverReport, Equipment, Operation, PayType } from "@/lib/types";

const PAY_TYPES: PayType[] = ["hourly", "day", "salary", "percentage", "mile"];
const EQUIPMENT: Equipment[] = ["curtain", "reefer", "flatbed", "tanker", "specialized"];
const OPERATIONS: Operation[] = ["domestic", "uk", "europe"];

export type ReportInput = {
  countryCode?: "IE" | "ES" | "US";
  companySlug: string;
  companyName?: string;
  role: string;
  tenure: string;
  payType: PayType;
  equipment: Equipment;
  operation: Operation;
  ratePerMile?: number;
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
  if (body.countryCode !== undefined && !isMarket(body.countryCode)) return { error: "Unsupported country." };
  const countryCode = marketFrom(body.countryCode);
  const catalogue = countryCode === "IE" ? fleet : countryCode === "ES" ? spanishCompanies : [];
  const submittedName = asString(body.companyName).replace(/\s+/g, " ");
  if (submittedName.length > 120) return { error: "Company name must be 120 characters or fewer." };
  const legacyCompany = catalogue.find(company => company.slug === asString(body.companySlug));
  const companyName = submittedName || legacyCompany?.name || "";
  if (!companyName) return { error: "Enter the company name." };
  const identity = companyName.normalize("NFKC").toLowerCase();
  const known = catalogue.find(company => [company.name, company.shortName, company.slug]
    .some(name => name.normalize("NFKC").toLowerCase() === identity));
  // Names outside the directory cannot collide with curated companies or other alphabets.
  const companySlug = known?.slug ?? ("reported-" + createHash("sha256").update(countryCode === "IE" ? identity : `${countryCode}:${identity}`).digest("hex"));

  const weeklyPay = Number(body.weeklyPay);
  if (!Number.isFinite(weeklyPay) || weeklyPay <= 0 || weeklyPay > 20000) {
    return { error: "Weekly take-home must be a positive amount in the selected country’s currency." };
  }

  const hoursPerWeek = Number(body.hoursPerWeek);
  if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 90) {
    return { error: "Hours per week has to be a real number." };
  }

  const ratePerMile = optionalNumber(body.ratePerMile, 100);
  if (ratePerMile === false || (body.payType === "mile" && (countryCode !== "US" || ratePerMile == null))) return { error: "Per-mile pay requires a US report and a USD-per-mile rate." };
  const hourlyRate = optionalNumber(body.hourlyRate, 80);
  const kmPerWeek = optionalNumber(body.kmPerWeek, 10000);
  if (hourlyRate === false || kmPerWeek === false) {
    return { error: "Hourly rate and km must be valid numbers if provided." };
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
      countryCode,
      companySlug,
      companyName,
      role: asString(body.role).slice(0, 80) || "HGV driver",
      tenure: asString(body.tenure).slice(0, 40) || "1–2 years",
      payType,
      equipment,
      operation,
      ratePerMile,
      hourlyRate,
      weeklyPay: Math.round(weeklyPay),
      kmPerWeek,
      hoursPerWeek: Math.round(hoursPerWeek),
      body: "",
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
