import { fleet } from "@/lib/data";
import { classifyAllowance, classifyDeduction } from "@/lib/payroll/classify";
import type { PayFrequency, Payslip, PayslipInput } from "@/lib/payroll/types";

const FREQUENCIES: PayFrequency[] = ["weekly", "fortnightly", "lunar", "monthly", "unknown"];

export function parsePayslipInput(raw: unknown): { input?: PayslipInput; error?: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "Send the figures from the payslip." };
  }
  const body = raw as Record<string, unknown>;
  const paymentDate = asDate(body.paymentDate);
  if (!paymentDate) {
    return { error: "Payment date is required (YYYY-MM-DD)." };
  }

  const employerSlug = asString(body.employerSlug);
  if (employerSlug && !fleet.some((company) => company.slug === employerSlug)) {
    return { error: "Pick a listed haulier, or leave employer blank." };
  }

  const payFrequency = FREQUENCIES.includes(body.payFrequency as PayFrequency)
    ? (body.payFrequency as PayFrequency)
    : "unknown";

  const moneyFields = [
    "employmentWeeks",
    "basicHours",
    "basicRate",
    "basicPay",
    "overtimeHours",
    "overtimeRate",
    "overtimePay",
    "grossPay",
    "netPay",
    "cumulativeGross",
    "cumulativeTax",
    "totalInsurableWeeks",
  ] as const;

  const parsed: Record<string, number | null> = {};
  for (const key of moneyFields) {
    const value = optionalNumber(body[key], key === "basicHours" || key === "overtimeHours" || key === "employmentWeeks" || key === "totalInsurableWeeks" ? 400 : 1_000_000);
    if (value === false) {
      return { error: `“${key}” has to be a real number if you fill it in.` };
    }
    parsed[key] = value ?? null;
  }

  if (
    parsed.grossPay == null &&
    parsed.netPay == null &&
    parsed.basicPay == null &&
    parsed.overtimePay == null
  ) {
    return { error: "Enter at least one pay figure from the slip (basic, overtime, gross or net)." };
  }

  const deductions = parseLines(body.deductions);
  const allowances = parseLines(body.allowances);
  if (deductions === false || allowances === false) {
    return { error: "Each allowance or deduction needs a label and a euro amount." };
  }

  return {
    input: {
      employerSlug: employerSlug || null,
      paymentDate,
      payPeriodStart: asDate(body.payPeriodStart),
      payPeriodEnd: asDate(body.payPeriodEnd),
      payFrequency,
      employmentWeeks: parsed.employmentWeeks,
      basicHours: parsed.basicHours,
      basicRate: parsed.basicRate,
      basicPay: parsed.basicPay,
      overtimeHours: parsed.overtimeHours,
      overtimeRate: parsed.overtimeRate,
      overtimePay: parsed.overtimePay,
      allowances,
      deductions,
      grossPay: parsed.grossPay,
      netPay: parsed.netPay,
      cumulativeGross: parsed.cumulativeGross,
      cumulativeTax: parsed.cumulativeTax,
      totalInsurableWeeks: parsed.totalInsurableWeeks,
    },
  };
}

export function toStoredPayslip(userId: string, input: PayslipInput): Payslip {
  const deductions = (input.deductions ?? []).map((line) =>
    classifyDeduction(line.rawLabel, line.amount, "IE"),
  );
  const allowances = (input.allowances ?? []).map((line) =>
    classifyAllowance(line.rawLabel, line.amount),
  );
  const needsReview = deductions.some((line) => line.needsReview) || allowances.some((line) => line.needsReview);

  return {
    id: crypto.randomUUID(),
    userId,
    countryCode: "IE",
    currency: "EUR",
    employerSlug: input.employerSlug ?? null,
    paymentDate: input.paymentDate,
    payPeriodStart: input.payPeriodStart ?? null,
    payPeriodEnd: input.payPeriodEnd ?? null,
    payFrequency: input.payFrequency ?? "unknown",
    employmentWeeks: input.employmentWeeks ?? null,
    basicHours: input.basicHours ?? null,
    basicRate: input.basicRate ?? null,
    basicPay: input.basicPay ?? null,
    overtimeHours: input.overtimeHours ?? null,
    overtimeRate: input.overtimeRate ?? null,
    overtimePay: input.overtimePay ?? null,
    allowances,
    deductions,
    grossPay: input.grossPay ?? null,
    netPay: input.netPay ?? null,
    cumulativeGross: input.cumulativeGross ?? null,
    cumulativeTax: input.cumulativeTax ?? null,
    totalInsurableWeeks: input.totalInsurableWeeks ?? null,
    sourceDocumentId: null,
    extractionConfidence: 1,
    reviewStatus: needsReview ? "needs_review" : "extracted",
    createdAt: new Date().toISOString(),
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asDate(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const time = Date.parse(text);
  if (!Number.isFinite(time)) return null;
  return text;
}

function optionalNumber(value: unknown, max: number): number | null | false {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) return false;
  return Math.round(parsed * 100) / 100;
}

function parseLines(value: unknown): { rawLabel: string; amount: number }[] | false {
  if (value == null || value === "") return [];
  if (!Array.isArray(value)) return false;
  const lines: { rawLabel: string; amount: number }[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    const rawLabel = asString(row.rawLabel);
    const amount = optionalNumber(row.amount, 1_000_000);
    if (!rawLabel && (amount == null || amount === 0)) continue;
    if (!rawLabel || amount == null || amount === false) return false;
    lines.push({ rawLabel: rawLabel.slice(0, 80), amount });
  }
  return lines;
}
