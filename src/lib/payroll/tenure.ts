import type { TenureBand, TenureSource } from "@/lib/payroll/types";

export function tenureMonthsFromStart(startDate: string, asOf: string): number {
  const start = parseUtc(startDate);
  const end = parseUtc(asOf);
  if (!start || !end || end < start) return 0;
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  months += end.getUTCMonth() - start.getUTCMonth();
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function tenureBandFromMonths(months: number): TenureBand {
  if (months < 12) return "0_1";
  if (months < 36) return "1_3";
  if (months < 60) return "3_5";
  return "5_plus";
}

export function tenureConfidence(source: TenureSource | null): number | null {
  if (!source) return null;
  if (source === "user_declared") return 0.4;
  if (source === "payslip") return 0.7;
  if (source === "other_verified_document") return 0.8;
  return 0.9;
}

export function isDocumentVerifiedTenure(source: TenureSource | null): boolean {
  return source === "employment_contract" || source === "other_verified_document" || source === "payslip";
}

function parseUtc(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const time = Date.parse(`${isoDate}T00:00:00Z`);
  return Number.isFinite(time) ? new Date(time) : null;
}
