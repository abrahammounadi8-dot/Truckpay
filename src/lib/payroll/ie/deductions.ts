import type { DeductionCategory, MoneyLine, StatutoryClass } from "@/lib/payroll/types";

type Rule = {
  pattern: RegExp;
  code: DeductionCategory;
  statutoryClass: StatutoryClass;
  confidence: number;
};

/** Irish payslip labels only. Other countries add their own lists; do not guess. */
export const IRELAND_DEDUCTION_RULES: Rule[] = [
  { pattern: /\bpaye\b|income\s*tax|tax\s*deducted/i, code: "PAYE", statutoryClass: "statutory", confidence: 0.95 },
  { pattern: /\busc\b|universal\s*social\s*charge/i, code: "USC", statutoryClass: "statutory", confidence: 0.95 },
  { pattern: /\bprsi\b|pay[\s-]*related\s*social/i, code: "PRSI", statutoryClass: "statutory", confidence: 0.95 },
  { pattern: /\bpension\b|\bprsa\b|superannuation|occupational\s*pension/i, code: "PENSION", statutoryClass: "non_statutory", confidence: 0.8 },
  { pattern: /\badvance\b|\bloan\b|recoup|subsistence\s*repay/i, code: "ADVANCE", statutoryClass: "non_statutory", confidence: 0.75 },
  { pattern: /\bdamage\b|\brepair\b|write[\s-]*off/i, code: "DAMAGE", statutoryClass: "non_statutory", confidence: 0.7 },
  { pattern: /\bppe\b|\bequipment\b|\btools?\b/i, code: "EQUIPMENT", statutoryClass: "non_statutory", confidence: 0.7 },
  { pattern: /\buniform\b|hi[\s-]?vis|workwear/i, code: "UNIFORM", statutoryClass: "non_statutory", confidence: 0.7 },
  { pattern: /\baccommodation\b|\bdigs\b|\blodging\b|\brent\b/i, code: "ACCOMMODATION", statutoryClass: "non_statutory", confidence: 0.7 },
  { pattern: /\btraining\b|\bcpc\b|driver\s*cpc|module/i, code: "TRAINING", statutoryClass: "non_statutory", confidence: 0.7 },
  { pattern: /\battachment\b|\baoe\b|maintenance\s*order|garnishee|court\s*order/i, code: "LEGAL_ORDER", statutoryClass: "statutory", confidence: 0.8 },
];

const REVIEW_BELOW = 0.85;

export function classifyIrishDeduction(rawLabel: string, rawAmount: number): MoneyLine {
  const label = rawLabel.trim();
  if (!label) {
    return line(label, rawAmount, "UNKNOWN", "unknown", 0, true);
  }
  for (const rule of IRELAND_DEDUCTION_RULES) {
    if (rule.pattern.test(label)) {
      return line(
        label,
        rawAmount,
        rule.code,
        rule.statutoryClass,
        rule.confidence,
        rule.confidence < REVIEW_BELOW,
      );
    }
  }
  return line(label, rawAmount, "UNKNOWN", "unknown", 0, true);
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
