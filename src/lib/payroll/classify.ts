import { classifyIrishDeduction } from "@/lib/payroll/ie/deductions";
import type { DeductionCategory, MoneyLine, StatutoryClass } from "@/lib/payroll/types";

/**
 * Classify a raw deduction label. Unknown labels stay UNKNOWN and need review.
 * Never maps unknown amounts to illegal or incorrect pay.
 * Country-specific rules live under src/lib/payroll/<country>/.
 */
export function classifyDeduction(rawLabel: string, rawAmount: number, countryCode = "IE"): MoneyLine {
  const label = rawLabel.trim();
  if (!label) {
    return line(label, rawAmount, "UNKNOWN", "unknown", 0, true);
  }

  if (countryCode === "IE") {
    return classifyIrishDeduction(label, rawAmount);
  }

  return line(label, rawAmount, "UNKNOWN", "unknown", 0, true);
}

export function classifyAllowance(rawLabel: string, amount: number) {
  const label = rawLabel.trim() || "Allowance";
  return {
    rawLabel: label,
    amount,
    normalizedCategory: label,
    confidenceScore: 0,
    needsReview: true,
  };
}

function line(
  rawLabel: string,
  amount: number,
  normalizedCategory: DeductionCategory,
  statutoryClass: StatutoryClass,
  confidenceScore: number,
  needsReview: boolean,
): MoneyLine {
  return {
    rawLabel,
    amount,
    normalizedCategory,
    statutoryClass,
    confidenceScore,
    needsReview,
  };
}
