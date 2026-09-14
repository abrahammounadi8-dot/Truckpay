/** Ireland-specific payroll rules. Keep country logic here so core TruckPay stays country-agnostic. */

export { classifyIrishDeduction, IRELAND_DEDUCTION_RULES } from "@/lib/payroll/ie/deductions";
export { inclusivePeriodDays, irishTaxWeek, type IrishTaxWeek } from "@/lib/payroll/ie/weeks";
