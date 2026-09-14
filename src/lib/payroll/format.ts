export function formatEuro(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

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
