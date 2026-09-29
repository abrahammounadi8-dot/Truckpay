import { parsePayslipInput, toStoredPayslip } from "./parse";
import { checkAmountReceipt } from "./amount-review";
import { consecutiveOnboarding } from "./onboarding";
import { validateEmploymentStart } from "./employment-month";
import { attachProcessing } from "./process";
export function preparePayslipBatch(userId: string, items: unknown, startMonth: unknown) {
 if (!Array.isArray(items) || items.length !== 3) throw Error("Prepara tres nóminas antes de confirmar.");
 const records = items.map(item => {
  const parsed = parsePayslipInput(item);
  if (!parsed.input || parsed.error) throw Error(parsed.error || "Revisa la nómina.");
  const check = checkAmountReceipt(userId, item?.amountReceipt, parsed.input);
  if (check.error || check.audit) throw Error(check.error || "Usa los importes originales del PDF.");
  if (!parsed.input.employerName?.trim() || !parsed.input.employerSlug) throw Error("Indica el nombre de la empresa.");
  return attachProcessing(toStoredPayslip(userId, parsed.input));
 });
 if (!consecutiveOnboarding(records).unlocked) throw Error("Las tres nóminas deben ser distintas, consecutivas y de la misma empresa y frecuencia.");
 const error = validateEmploymentStart(startMonth, records[0].employerSlug!, records);
 if (error) throw Error(error);
 return records;
}
