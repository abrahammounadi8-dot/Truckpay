import { resolveEmployer } from "@/lib/payroll/employer";
import { classifyAllowance, classifyDeduction } from "@/lib/payroll/classify";
import { hashFromInput } from "@/lib/payroll/fingerprint";
import { attachProcessing } from "@/lib/payroll/process";
import { rejectIdentifierFields } from "@/lib/payroll/privacy";
import type { PayFrequency, Payslip, PayslipInput } from "@/lib/payroll/types";

const FREQUENCIES: PayFrequency[] = ["weekly", "fortnightly", "lunar", "monthly", "unknown"];

export function parsePayslipInput(raw: unknown): { input?: PayslipInput; error?: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "Send the figures from the payslip." };
  }
  const body = raw as Record<string, unknown>;
  const identifierError = rejectIdentifierFields(body);
  if (identifierError) return { error: identifierError };

  const paymentDate = asDate(body.paymentDate);
  if (!paymentDate) {
    return { error: "Payment date is required (YYYY-MM-DD)." };
  }

  const named = asString(body.employerName) || asString(body.employerSlug);
  const employer = resolveEmployer(named);

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
    "holidayPay",
    "cumulativeGross",
    "cumulativeTax",
    "cumulativePrsi",
    "cumulativeUsc",
    "cumulativePension",
    "totalInsurableWeeks",
  ] as const;

  const parsed: Record<string, number | null> = {};
  for (const key of moneyFields) {
    const value = optionalNumber(
      body[key],
      key === "basicHours" ||
        key === "overtimeHours" ||
        key === "employmentWeeks" ||
        key === "totalInsurableWeeks"
        ? 400
        : 1_000_000,
    );
    if (value === false) {
      return { error: `“${key}” has to be a real number if you fill it in.` };
    }
    parsed[key] = value ?? null;
  }

  const weekNumber = optionalWeek(body.weekNumber);
  if (weekNumber === false) {
    return { error: "Week number must be a whole number from 1 to 53 if it is printed on the slip." };
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
      employerSlug: employer.employerSlug,
      employerName: employer.employerName,
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
      holidayPay: parsed.holidayPay,
      weekNumber,
      cumulativeGross: parsed.cumulativeGross,
      cumulativeTax: parsed.cumulativeTax,
      cumulativePrsi: parsed.cumulativePrsi,
      cumulativeUsc: parsed.cumulativeUsc,
      cumulativePension: parsed.cumulativePension,
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

  return attachProcessing({
    id: crypto.randomUUID(),
    userId,
    countryCode: "IE",
    currency: "EUR",
    employerSlug: input.employerSlug ?? null,
    employerName: input.employerName ?? null,
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
    holidayPay: input.holidayPay ?? null,
    weekNumber: input.weekNumber ?? null,
    cumulativeGross: input.cumulativeGross ?? null,
    cumulativeTax: input.cumulativeTax ?? null,
    cumulativePrsi: input.cumulativePrsi ?? null,
    cumulativeUsc: input.cumulativeUsc ?? null,
    cumulativePension: input.cumulativePension ?? null,
    totalInsurableWeeks: input.totalInsurableWeeks ?? null,
    sourceDocumentId: null,
    contentHash: hashFromInput(input),
    extractionConfidence: 1,
    reviewStatus: needsReview ? "needs_review" : "extracted",
    createdAt: new Date().toISOString(),
  });
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

function optionalWeek(value: unknown): number | null | false {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 53) return false;
  return parsed;
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
