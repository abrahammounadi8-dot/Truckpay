import type { Payslip } from "@/lib/payroll/types";

function periodDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Convert a slip's gross/hours/rate onto a weekly equivalent without assuming
 * one payslip is one working week.
 */
export function weeklyEquivalentGross(slip: Payslip): number | null {
  if (slip.grossPay == null) return null;
  if (slip.employmentWeeks && slip.employmentWeeks > 0) {
    return round2(slip.grossPay / slip.employmentWeeks);
  }
  const days = periodDays(slip.payPeriodStart, slip.payPeriodEnd);
  if (days && days > 0) return round2(slip.grossPay / (days / 7));
  if (slip.payFrequency === "weekly") return round2(slip.grossPay);
  if (slip.payFrequency === "fortnightly") return round2(slip.grossPay / 2);
  if (slip.payFrequency === "lunar") return round2(slip.grossPay / 4);
  return null;
}

export function weeklyEquivalentHours(slip: Payslip): number | null {
  if (slip.basicHours == null) return null;
  if (slip.employmentWeeks && slip.employmentWeeks > 0) {
    return round2(slip.basicHours / slip.employmentWeeks);
  }
  const days = periodDays(slip.payPeriodStart, slip.payPeriodEnd);
  if (days && days > 0) return round2(slip.basicHours / (days / 7));
  if (slip.payFrequency === "weekly") return round2(slip.basicHours);
  if (slip.payFrequency === "fortnightly") return round2(slip.basicHours / 2);
  if (slip.payFrequency === "lunar") return round2(slip.basicHours / 4);
  return null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid]!;
  return round2((sorted[mid - 1]! + sorted[mid]!) / 2);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
