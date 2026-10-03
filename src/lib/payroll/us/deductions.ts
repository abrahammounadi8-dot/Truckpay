import type { DeductionCategory, MoneyLine } from "../types";
// Classifies printed employee deduction labels, not tax liabilities or legality.
// IRS: https://www.irs.gov/businesses/small-businesses-self-employed/understanding-employment-taxes
const rules: [RegExp, DeductionCategory, boolean][] = [
  [/^(?:federal(?: income)? tax|federal withholding|fed(?:eral)? w[ /-]?h|fitw?)$/i, "FEDERAL_TAX", true],
  [/^(?:state(?: income)? tax|state withholding|sitw?)$/i, "STATE_TAX", true],
  [/^(?:local(?: income)? tax|local withholding|city tax)$/i, "LOCAL_TAX", true],
  [/^(?:social security(?: tax)?|oasd[i]?|fica[ -]?(?:ss|social security))$/i, "SOCIAL_SECURITY", true],
  [/^(?:medicare(?: tax)?|additional medicare(?: tax)?|fica[ -]?(?:med|medicare))$/i, "MEDICARE", true],
  [/^(?:401\(?k\)?|401\(?k\)? contribution|retirement|pension)$/i, "PENSION", false],
  [/^(?:health insurance|medical insurance|dental insurance|vision insurance)$/i, "HEALTH_INSURANCE", false],
];
export function classifyUsDeduction(label: string, amount: number): MoneyLine {
  const match = rules.find(([pattern]) => pattern.test(label.trim()));
  return { rawLabel: label.trim(), amount, normalizedCategory: match?.[1] ?? "UNKNOWN", statutoryClass: match ? match[2] ? "statutory" : "non_statutory" : "unknown", confidenceScore: match ? 0.95 : 0, needsReview: !match };
}
