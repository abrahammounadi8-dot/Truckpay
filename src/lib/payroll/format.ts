export function formatPayrollMoney(value: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatEuro(value: number) { return formatPayrollMoney(value); }
export function formatPayrollMoneyMaybe(value: number | null | undefined, currency = "EUR") { return value == null ? "—" : formatPayrollMoney(value, currency); }

export function formatEuroMaybe(value: number | null | undefined): string {
  return value == null ? "—" : formatEuro(value);
}

export function payslipTitle(slip: { paymentDate: string }): string {
  return `Paid ${slip.paymentDate}`;
}

export function toPublicPayslip<T extends { userId: string }>(slip: T): Omit<T, "userId"> {
  const copy = { ...slip };
  delete (copy as { userId?: string }).userId;
  return copy as Omit<T, "userId">;
}
