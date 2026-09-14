import { fleet } from "@/lib/data";
import type { DriverReport, PayType } from "@/lib/types";

const PAY_TYPES: PayType[] = ["cpm", "salary", "percentage", "hourly"];
const TENURES = ["Under a year", "1–2 years", "2–5 years", "5+ years"];

export type ReportInput = {
  companySlug: string;
  nickname: string;
  role: string;
  tenure: string;
  payType: PayType;
  cpm?: number;
  weeklyPay: number;
  milesPerWeek: number;
  homeTime: string;
  rating: number;
  title: string;
  body: string;
  wouldRecommend: boolean;
};

export function parseReportInput(raw: unknown): { report?: ReportInput; error?: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "Send a JSON report." };
  }
  const body = raw as Record<string, unknown>;
  const companySlug = asString(body.companySlug);
  if (!fleet.some((company) => company.slug === companySlug)) {
    return { error: "Pick a carrier on the board." };
  }
  const nickname = asString(body.nickname).slice(0, 40);
  const title = asString(body.title).slice(0, 140);
  const story = asString(body.body).slice(0, 4000);
  if (nickname.length < 2 || title.length < 8 || story.length < 20) {
    return { error: "Need a nickname, a headline, and the story from the settlement." };
  }
  const weeklyPay = Number(body.weeklyPay);
  const milesPerWeek = Number(body.milesPerWeek);
  const rating = Number(body.rating);
  if (!Number.isFinite(weeklyPay) || weeklyPay <= 0 || weeklyPay > 20000) {
    return { error: "Weekly take-home has to be a real number." };
  }
  if (!Number.isFinite(milesPerWeek) || milesPerWeek <= 0 || milesPerWeek > 8000) {
    return { error: "Miles per week has to be a real number." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating has to be 1 through 5." };
  }
  const payType = PAY_TYPES.includes(body.payType as PayType) ? (body.payType as PayType) : "cpm";
  const tenure = TENURES.includes(asString(body.tenure)) ? asString(body.tenure) : "1–2 years";
  const cpm = body.cpm === undefined || body.cpm === null || body.cpm === "" ? undefined : Number(body.cpm);
  if (cpm !== undefined && (!Number.isFinite(cpm) || cpm <= 0 || cpm > 5)) {
    return { error: "CPM has to be a number like 0.52." };
  }

  return {
    report: {
      companySlug,
      nickname,
      role: asString(body.role).slice(0, 80) || "Driver",
      tenure,
      payType,
      cpm,
      weeklyPay: Math.round(weeklyPay),
      milesPerWeek: Math.round(milesPerWeek),
      homeTime: asString(body.homeTime).slice(0, 80) || "Not specified",
      rating,
      title,
      body: story,
      wouldRecommend: Boolean(body.wouldRecommend),
    },
  };
}

export function toStoredReport(input: ReportInput): DriverReport {
  return {
    id: `rpt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    date: new Date().toISOString().slice(0, 10),
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
