/** Payroll domain. Separate from legacy public DriverReport. Ireland-first, country-extensible. */

export type CountryCode = "IE" | "GB" | "ES" | "PL" | "OTHER";

export type CurrencyCode = "EUR" | "GBP" | "PLN";

export type PayFrequency = "weekly" | "fortnightly" | "lunar" | "monthly" | "unknown";

export type StatutoryClass = "statutory" | "non_statutory" | "unknown";

export type ReviewStatus = "extracted" | "needs_review" | "confirmed";

export type DataOrigin = "source" | "derived" | "unverified";

export type VerificationStatus = "source" | "derived" | "unverified" | "needs_review";

export type WeekAssignmentBasis =
  | "printed_week_number"
  | "period_dates"
  | "period_start"
  | "period_end"
  | "insufficient";

export type WeekAssignment = {
  countryCode: CountryCode;
  year: number | null;
  weekNumber: number | null;
  basis: WeekAssignmentBasis;
  derived: boolean;
  verification_status: VerificationStatus;
  confidence: number;
  reason: string;
};

export type ProvenanceField<T> = {
  value: T | null;
  source: DataOrigin;
  derived: boolean;
  confidence: number;
  verification_status: VerificationStatus;
};

export type YearToDateTotals = {
  gross: number | null;
  tax: number | null;
  prsi: number | null;
  usc: number | null;
  pension: number | null;
  insurableWeeks: number | null;
};

export type PayslipProvenance = {
  employer: ProvenanceField<string>;
  grossPay: ProvenanceField<number>;
  netPay: ProvenanceField<number>;
  basicHours: ProvenanceField<number>;
  overtimeHours: ProvenanceField<number>;
  hourlyRate: ProvenanceField<number>;
  overtimeRate: ProvenanceField<number>;
  allowances: ProvenanceField<number>;
  tax: ProvenanceField<number>;
  prsi: ProvenanceField<number>;
  usc: ProvenanceField<number>;
  pension: ProvenanceField<number>;
  otherDeductions: ProvenanceField<number>;
  holidayPay: ProvenanceField<number>;
  weekNumber: ProvenanceField<number>;
  payPeriodStart: ProvenanceField<string>;
  payPeriodEnd: ProvenanceField<string>;
  yearToDate: ProvenanceField<YearToDateTotals>;
};

export type WeeklyNormalizedRecord = {
  payslipId: string;
  countryCode: CountryCode;
  year: number | null;
  weekNumber: number | null;
  weekAssigned: boolean;
  actual: {
    grossPay: number | null;
    netPay: number | null;
    basicHours: number | null;
    overtimeHours: number | null;
    hourlyRate: number | null;
    overtimeRate: number | null;
    holidayPay: number | null;
    allowancesTotal: number | null;
  };
  expected: {
    grossPay: number | null;
    status: "calculated" | "insufficient_data";
    derived: true;
    reason: string;
    components: {
      basic: number | null;
      overtime: number | null;
      allowances: number | null;
      holidayPay: number | null;
    };
  };
  comparable: boolean;
  variance: number | null;
  varianceNote: string | null;
};

export type AnomalyStatus = "confirmed" | "possible_anomaly" | "needs_review" | "insufficient_data";

export type AnomalyKind =
  | "missing_hours"
  | "incorrect_hourly_rate"
  | "unpaid_overtime"
  | "unexpected_deduction"
  | "duplicate_payslip"
  | "missing_week"
  | "payslip_inconsistency";

export type Anomaly = {
  id: string;
  kind: AnomalyKind;
  status: AnomalyStatus;
  payslipId: string | null;
  summary: string;
  evidence: { fields: string[]; note: string };
};

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
  | "recurring_deduction"
  | "new_deduction"
  | "pay_change"
  | "duplicate_payslip"
  | "missing_period"
  | "non_consecutive"
  | "mixed_employer";

export type EvidenceLevel = "driver_reported" | "payroll_verified";

export type PayConfidence = "low" | "medium" | "high";

export type TenureBand = "0_1" | "1_3" | "3_5" | "5_plus";

export type TenureSource =
  | "payslip"
  | "employment_contract"
  | "user_declared"
  | "other_verified_document";

export type JobType = "distribution" | "trunking" | "specialised" | "other";

export type VehicleType =
  | "articulated"
  | "rigid"
  | "tanker"
  | "fuel"
  | "refrigerated"
  | "container"
  | "specialised"
  | "unknown";

export type TimeFraction = "full_time" | "part_time";

export type ShiftType = "day" | "night" | "rotating" | "mixed";

export type AnalysisStatus = "need_more" | "incomplete" | "verified";

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
  holidayPay: number | null;
  weekNumber: number | null;
  cumulativeGross: number | null;
  cumulativeTax: number | null;
  cumulativePrsi: number | null;
  cumulativeUsc: number | null;
  cumulativePension: number | null;
  totalInsurableWeeks: number | null;
  sourceDocumentId: string | null;
  contentHash: string;
  extractionConfidence: number;
  reviewStatus: ReviewStatus;
  createdAt: string;
  weekAssignment?: WeekAssignment;
  provenance?: PayslipProvenance;
  weeklyRecord?: WeeklyNormalizedRecord;
};

export type EmploymentProfile = {
  userId: string;
  employerSlug: string | null;
  employmentStartDate: string | null;
  tenureMonths: number | null;
  tenureBand: TenureBand | null;
  tenureSource: TenureSource | null;
  tenureConfidence: number | null;
  jobType: JobType;
  vehicleType: VehicleType;
  timeFraction: TimeFraction;
  shiftType: ShiftType;
  payType: "hourly" | "day" | "salary" | "percentage";
  agreedBaseRate: number | null;
  countryCode: CountryCode;
  updatedAt: string;
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
  holidayPay?: number | null;
  weekNumber?: number | null;
  cumulativeGross?: number | null;
  cumulativeTax?: number | null;
  cumulativePrsi?: number | null;
  cumulativeUsc?: number | null;
  cumulativePension?: number | null;
  totalInsurableWeeks?: number | null;
};

export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = {
  confirmed: "Confirmed",
  possible_anomaly: "Possible anomaly",
  needs_review: "Needs review",
  insufficient_data: "Insufficient data",
};

export const WEEK_STATUS_LABELS: Record<VerificationStatus, string> = {
  source: "On the document",
  derived: "Derived",
  unverified: "Not on the document",
  needs_review: "Needs review",
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

export const TENURE_BAND_LABELS: Record<TenureBand, string> = {
  "0_1": "0–1 year",
  "1_3": "1–3 years",
  "3_5": "3–5 years",
  "5_plus": "5+ years",
};

export const TENURE_SOURCE_LABELS: Record<TenureSource, string> = {
  payslip: "Taken from a payslip",
  employment_contract: "Taken from an employment contract",
  user_declared: "You told us — not document-verified",
  other_verified_document: "Taken from another document",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  distribution: "Distribution",
  trunking: "Trunking / long haul",
  specialised: "Specialised",
  other: "Other",
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  articulated: "Articulated",
  rigid: "Rigid",
  tanker: "Tanker",
  fuel: "Fuel",
  refrigerated: "Refrigerated",
  container: "Container",
  specialised: "Specialised",
  unknown: "Not stated",
};

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  day: "Day",
  night: "Night",
  rotating: "Rotating",
  mixed: "Mixed",
};

export const TIME_FRACTION_LABELS: Record<TimeFraction, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
};

export const REQUIRED_PAYSLIPS = 3;

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  driver_reported: "Driver reported",
  payroll_verified: "Payroll verified",
};

export const PAY_CONFIDENCE_LABELS: Record<PayConfidence, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
