import { createHash } from "node:crypto";
import type { Payslip, PayslipInput } from "@/lib/payroll/types";

export function payslipContentHash(input: {
  employerSlug: string | null;
  employerName?: string | null;
  paymentDate: string;
  payPeriodStart: string | null;
  payPeriodEnd: string | null;
  grossPay: number | null;
  netPay: number | null;
  basicPay: number | null;
  basicHours: number | null;
  weekNumber?: number | null;
  holidayPay?: number | null;
}): string {
  const payload = [
    input.employerSlug ?? "",
    input.employerName ?? "",
    input.paymentDate,
    input.payPeriodStart ?? "",
    input.payPeriodEnd ?? "",
    num(input.grossPay),
    num(input.netPay),
    num(input.basicPay),
    num(input.basicHours),
    input.weekNumber == null ? "" : String(input.weekNumber),
    num(input.holidayPay ?? null),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export function hashFromInput(input: PayslipInput): string {
  return payslipContentHash({
    employerSlug: input.employerSlug ?? null,
    employerName: input.employerName ?? null,
    paymentDate: input.paymentDate,
    payPeriodStart: input.payPeriodStart ?? null,
    payPeriodEnd: input.payPeriodEnd ?? null,
    grossPay: input.grossPay ?? null,
    netPay: input.netPay ?? null,
    basicPay: input.basicPay ?? null,
    basicHours: input.basicHours ?? null,
    weekNumber: input.weekNumber ?? null,
    holidayPay: input.holidayPay ?? null,
  });
}

export function findDuplicate(existing: Payslip[], hash: string): Payslip | undefined {
  return existing.find((slip) => slip.contentHash === hash);
}

function num(value: number | null): string {
  return value == null ? "" : value.toFixed(2);
}
