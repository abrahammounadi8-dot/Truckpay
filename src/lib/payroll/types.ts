/** Payroll domain. Separate from legacy public DriverReport. Ireland-first, country-extensible. */

export type CountryCode = "IE" | "GB" | "ES" | "PL" | "OTHER";

export type CurrencyCode = "EUR" | "GBP" | "PLN";

export type PayFrequency = "weekly" | "fortnightly" | "lunar" | "monthly" | "unknown";

export type StatutoryClass = "statutory" | "non_statutory" | "unknown";

export type ReviewStatus = "extracted" | "needs_review" | "confirmed";

export type Epistemic = "fact" | "inference" | "unknown";

export type DocumentKind =
  | "payslip"
  | "contract"
  | "timesheet"
  | "roster"
  | "hours"
  | "tachograph"
  | "other";

export type RetentionPolicy = "process_and_delete" | "retain_until" | "user_held";

export type DeductionCategory =
  | "PAYE"
  | "PRSI"
  | "USC"
  | "PENSION"
  | "ADVANCE"
  | "DAMAGE"
  | "EQUIPMENT"
  | "UNIFORM"
  | "ACCOMMODATION"
  | "TRAINING"
  | "LEGAL_ORDER"
  | "OTHER"
  | "UNKNOWN";

export type FindingKind =
  | "arithmetic_basic"
  | "arithmetic_overtime"
  | "gross_net_gap"
  | "multi_week_payment"
  | "unknown_deduction"
  | "rate_change"
  | "recurring_deduction";

export type MoneyLine = {
  rawLabel: string;
  amount: number;
  normalizedCategory: DeductionCategory;
  statutoryClass: StatutoryClass;
  confidenceScore: number;
  needsReview: boolean;
};

export type AllowanceLine = {
  rawLabel: string;
  amount: number;
  normalizedCategory: string;
  confidenceScore: number;
  needsReview: boolean;
};

export type SourceDocumentMeta = {
  id: string;
  kind: DocumentKind;
  retention: RetentionPolicy;
  retainUntil: string | null;
  purgedAt: string | null;
  /** Original bytes are not stored when retention is process_and_delete. */
  stored: boolean;
};

export type Payslip = {
  id: string;
  userId: string;
  countryCode: CountryCode;
  currency: CurrencyCode;
  employerSlug: string | null;
  paymentDate: string;
  payPeriodStart: string | null;
  payPeriodEnd: string | null;
  payFrequency: PayFrequency;
  employmentWeeks: number | null;
  basicHours: number | null;
  basicRate: number | null;
  basicPay: number | null;
  overtimeHours: number | null;
  overtimeRate: number | null;
  overtimePay: number | null;
  allowances: AllowanceLine[];
  deductions: MoneyLine[];
  grossPay: number | null;
  netPay: number | null;
  cumulativeGross: number | null;
  cumulativeTax: number | null;
  totalInsurableWeeks: number | null;
  sourceDocumentId: string | null;
  extractionConfidence: number;
  reviewStatus: ReviewStatus;
  createdAt: string;
};

export type FindingEvidence = {
  fields: string[];
  expected: number | null;
  actual: number | null;
  note: string;
};

export type Finding = {
  id: string;
  payslipId: string;
  kind: FindingKind;
  epistemic: Epistemic;
  confidence: number;
  summary: string;
  evidence: FindingEvidence;
};

export type PayslipInput = {
  employerSlug?: string | null;
  paymentDate: string;
  payPeriodStart?: string | null;
  payPeriodEnd?: string | null;
  payFrequency?: PayFrequency;
  employmentWeeks?: number | null;
  basicHours?: number | null;
  basicRate?: number | null;
  basicPay?: number | null;
  overtimeHours?: number | null;
  overtimeRate?: number | null;
  overtimePay?: number | null;
  allowances?: { rawLabel: string; amount: number }[];
  deductions?: { rawLabel: string; amount: number }[];
  grossPay?: number | null;
  netPay?: number | null;
  cumulativeGross?: number | null;
  cumulativeTax?: number | null;
  totalInsurableWeeks?: number | null;
};

export const DEDUCTION_LABELS: Record<DeductionCategory, string> = {
  PAYE: "PAYE",
  PRSI: "PRSI",
  USC: "USC",
  PENSION: "Pension",
  ADVANCE: "Advance / recoup",
  DAMAGE: "Damage",
  EQUIPMENT: "Equipment",
  UNIFORM: "Uniform",
  ACCOMMODATION: "Accommodation",
  TRAINING: "Training",
  LEGAL_ORDER: "Legal order",
  OTHER: "Other",
  UNKNOWN: "Unknown — needs review",
};

export const FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  lunar: "Lunar (4 weeks)",
  monthly: "Monthly",
  unknown: "Not stated",
};
