import type { ExtractedPayslipDraft } from "../extract-text";
import type { PayslipInput } from "../types";
import { resolveEmployer } from "../employer";

/** Conservative US label/value reader. Current-period figures only; no tax estimation. */
export function extractUsPayslipText(raw: string): ExtractedPayslipDraft {
  const text = raw.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[redacted]")
    .replace(/^.*\b(?:ssn|social security number|employee id|employee number)\b.*$/gim, "[redacted]");
  if (/[€£]|\b(?:EUR|GBP|PAYE|PRSI|USC|semi[ -]?monthly|twice monthly)\b/i.test(text)) return { fields: {}, deductions: [], allowances: [], filledKeys: [] };
  if (/\b(?:owner[ -]operator|independent contractor|1099|settlement statement|carrier settlement)\b/i.test(text)) {
    return { fields: {}, deductions: [], allowances: [], filledKeys: [] };
  }
  const fields: Partial<PayslipInput> = { countryCode: "US", currency: "USD" };
  const deductions: { rawLabel: string; amount: number }[] = [];
  let ytd = false;
  const seen = new Set<string>();
  const put = (key: keyof PayslipInput, value: unknown) => {
    // Conflicting labels are unreadable; never select an arbitrary first value.
    if (seen.has(key) && (fields as Record<string, unknown>)[key] !== value) {
      delete (fields as Record<string, unknown>)[key];
      return;
    }
    if (!seen.has(key)) (fields as Record<string, unknown>)[key] = value;
    seen.add(key);
  };
  const amounts: [RegExp, keyof PayslipInput][] = [
    [/^(?:gross pay|gross earnings|total gross)$/i, "grossPay"],
    [/^(?:net pay|net earnings|take[ -]home pay)$/i, "netPay"],
    [/^(?:regular hours|basic hours)$/i, "basicHours"],
    [/^(?:regular rate|hourly rate|basic rate)$/i, "basicRate"],
    [/^(?:regular pay|regular earnings|basic pay)$/i, "basicPay"],
    [/^(?:overtime hours|ot hours)$/i, "overtimeHours"],
    [/^(?:overtime rate|ot rate)$/i, "overtimeRate"],
    [/^(?:overtime pay|ot pay)$/i, "overtimePay"],
    [/^(?:paid miles|pay miles)$/i, "paidMiles"],
    [/^(?:rate per mile|pay per mile|mileage rate)$/i, "ratePerMile"],
    [/^(?:mileage pay|mileage earnings)$/i, "mileagePay"],
    [/^(?:holiday pay)$/i, "holidayPay"],
  ];
  const deductionLabel = /^(?:federal(?: income)? tax|federal withholding|fed(?:eral)? w[ /-]?h|fitw?|state(?: income)? tax|state withholding|sitw?|local(?: income)? tax|local withholding|city tax|social security(?: tax)?|oasdi|fica[ -]?(?:ss|social security|med|medicare)|medicare(?: tax)?|additional medicare(?: tax)?|401\(?k\)?(?: contribution)?|retirement|pension|health insurance|medical insurance|dental insurance|vision insurance)$/i;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/^(?:year[ -]to[ -]date|ytd|cumulative)(?: totals)?\s*:?[ \t]*$/i.test(line)) ytd = true;
    if (/^(?:current|this) period\s*:?[ \t]*$/i.test(line)) ytd = false;
    if (ytd || /\b(?:ytd|year[ -]to[ -]date|cumulative)\b/i.test(line)) continue;
    const employer = line.match(/^(?:employer|employer name|company name)\s*:\s*(.+)$/i);
    if (employer) {
      const resolved = resolveEmployer(employer[1], "US");
      put("employerName", resolved.employerName); put("employerSlug", resolved.employerSlug);
    }
    const date = line.match(/^(pay date|payment date|check date|period start|pay period start|period end|pay period end)\s*:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})$/i);
    if (date) {
      const iso = usDate(date[2]);
      if (iso) put(/start/i.test(date[1]) ? "payPeriodStart" : /end/i.test(date[1]) ? "payPeriodEnd" : "paymentDate", iso);
    }
    const frequency = line.match(/^(?:pay frequency|frequency)\s*:\s*(weekly|biweekly|bi-weekly|every two weeks|monthly)$/i);
    if (frequency) put("payFrequency", /bi|two/i.test(frequency[1]) ? "fortnightly" : frequency[1].toLowerCase());
    // Single values only: multi-column current/YTD rows need layout-aware parsing.
    const match = line.match(/^(.+?)\s*(?::|\s{2,})\s*\$?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,4})?)\s*$/);
    if (!match) continue;
    const label = match[1].trim(), value = Number(match[2].replaceAll(",", ""));
    if (!Number.isFinite(value) || value > 1_000_000) continue;
    const field = amounts.find(([pattern]) => pattern.test(label));
    if (field) put(field[1], value);
    else if (deductionLabel.test(label)) deductions.push({ rawLabel: label, amount: value });
  }
  return { fields, deductions, allowances: [], filledKeys: Object.keys(fields).filter(key => key !== "countryCode" && key !== "currency") };
}
function usDate(raw: string): string | null {
  const parts = raw.split("/");
  const iso = parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}` : raw;
  const time = Date.parse(iso);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === iso ? iso : null;
}
