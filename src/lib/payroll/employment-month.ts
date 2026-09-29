import type { EmploymentProfile, Payslip, TenureBand } from "./types";
import { tenureBandFromMonths } from "./tenure";

export type EmploymentStart = { employerName: string; startMonth: string; source: "user_declared"; updatedAt: string };
export function validEmploymentMonth(value: unknown): value is string {
  return typeof value === "string" && /^(19\d{2}|20\d{2})-(0[1-9]|1[0-2])$/.test(value);
}
export function monthlyTenure(startMonth: string, asOf: string): { months: number; band: TenureBand } | null {
  const end = asOf.slice(0, 7);
  if (!validEmploymentMonth(startMonth) || !validEmploymentMonth(end) || end < startMonth) return null;
  const [sy, sm] = startMonth.split("-").map(Number), [ey, em] = end.split("-").map(Number);
  const months = (ey - sy) * 12 + em - sm;
  return { months, band: tenureBandFromMonths(months) };
}
export function employmentStartFor(profile: EmploymentProfile | null, employerSlug: string | null | undefined) {
  if (!employerSlug || !profile?.employmentStarts || !Object.hasOwn(profile.employmentStarts, employerSlug)) return null;
  const entry = profile.employmentStarts[employerSlug];
  return validEmploymentMonth(entry.startMonth) ? entry : null;
}
export function payslipTenureDate(slip: Pick<Payslip, "paymentDate" | "payPeriodEnd">) { return slip.payPeriodEnd || slip.paymentDate; }
export function validateEmploymentStart(startMonth: unknown, employerSlug: string, slips: Pick<Payslip, "employerSlug" | "paymentDate" | "payPeriodEnd">[], asOf?: string, today = new Date().toISOString().slice(0, 7)): string | null {
  if (!validEmploymentMonth(startMonth)) return "Indica el mes y año de inicio válidos (AAAA-MM).";
  if (startMonth > today) return "El inicio no puede estar en el futuro.";
  const dates = slips.filter(s => s.employerSlug === employerSlug).map(payslipTenureDate);
  if (asOf) dates.push(asOf);
  if (dates.some(date => !monthlyTenure(startMonth, date))) return "El inicio es posterior a una nómina de esta empresa. Revisa el mes. Si volviste a trabajar allí tras una baja, necesitamos separar las etapas; no se supondrá empleo continuo.";
  return null;
}
/** Context is specific to this employer and historical payslip, never fiscal week or file count. */
export function profileAtPayslip(profile: EmploymentProfile | null, slip: Pick<Payslip, "employerSlug" | "employerName" | "paymentDate" | "payPeriodEnd">): EmploymentProfile | null {
  if (!profile) return null;
  const start = employmentStartFor(profile, slip.employerSlug);
  const tenure = start ? monthlyTenure(start.startMonth, payslipTenureDate(slip)) : null;
  const sameEmployer = profile.employerSlug === slip.employerSlug;
  return { ...profile, employerSlug: slip.employerSlug, employerName: slip.employerName,
    employmentStartDate: null, employmentStartMonth: start?.startMonth ?? null,
    tenureMonths: tenure?.months ?? null, tenureBand: tenure?.band ?? null, tenureSource: tenure ? "user_declared" : null, tenureConfidence: tenure ? 0.4 : null,
    ...(sameEmployer ? {} : { jobType: "other", vehicleType: "unknown", timeFraction: "full_time", shiftType: "mixed", payType: "hourly", agreedBaseRate: null }),
  };
}

export function tenureBandLabel(band: TenureBand, spanish = false) {
  return (spanish ? { "0_1": "Menos de 1 año", "1_3": "De 1 a menos de 3 años", "3_5": "De 3 a menos de 5 años", "5_plus": "5 años o más" } : { "0_1": "Less than 1 year", "1_3": "1 to less than 3 years", "3_5": "3 to less than 5 years", "5_plus": "5 years or more" })[band];
}
