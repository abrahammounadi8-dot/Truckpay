import type { PayFrequency } from "./types";

export type Line = { key: string; rawLabel: string; amount: string };

export type FormState = {
  paidMiles: string;
  ratePerMile: string;
  mileagePay: string;
  employerName: string;
  paymentDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payFrequency: PayFrequency;
  employmentWeeks: string;
  weekNumber: string;
  basicHours: string;
  basicRate: string;
  basicPay: string;
  overtimeHours: string;
  overtimeRate: string;
  overtimePay: string;
  holidayPay: string;
  grossPay: string;
  netPay: string;
  cumulativeGross: string;
  cumulativeTax: string;
  cumulativePrsi: string;
  cumulativeUsc: string;
  cumulativePension: string;
  totalInsurableWeeks: string;
};

export const emptyForm: FormState = {
  paidMiles: "", ratePerMile: "", mileagePay: "",
  employerName: "",
  paymentDate: "",
  payPeriodStart: "",
  payPeriodEnd: "",
  payFrequency: "unknown",
  employmentWeeks: "",
  weekNumber: "",
  basicHours: "",
  basicRate: "",
  basicPay: "",
  overtimeHours: "",
  overtimeRate: "",
  overtimePay: "",
  holidayPay: "",
  grossPay: "",
  netPay: "",
  cumulativeGross: "",
  cumulativeTax: "",
  cumulativePrsi: "",
  cumulativeUsc: "",
  cumulativePension: "",
  totalInsurableWeeks: "",
};

export function emptyLine(seed?: string): Line {
  return { key: seed ?? crypto.randomUUID(), rawLabel: "", amount: "" };
}


/** Replace slip values; only the group pay frequency may be reused explicitly. */
export function draftFromExtraction(
  fields: Record<string, string | number | null>,
  deductions: { rawLabel: string; amount: number }[],
  allowances: { rawLabel: string; amount: number }[],
  groupFrequency: PayFrequency = "unknown",
) {
  const form = { ...emptyForm };
  for (const key of Object.keys(emptyForm) as (keyof FormState)[]) {
    const value = fields[key];
    if (value == null || value === "") continue;
    if (key === "payFrequency" && !["unknown", "weekly", "fortnightly", "lunar", "monthly"].includes(String(value))) continue;
    (form as Record<string, string>)[key] = String(value);
  }
  if (form.payFrequency === "unknown") form.payFrequency = groupFrequency;
  const lines = (items: { rawLabel: string; amount: number }[]) =>
    items.length ? items.map(line => ({ key: crypto.randomUUID(), rawLabel: line.rawLabel, amount: String(line.amount) })) : [emptyLine()];
  return { form, deductions: lines(deductions), allowances: lines(allowances) };
}
