import { inclusivePeriodDays, irishTaxWeek } from "@/lib/payroll/ie/weeks";
import type { CountryCode, Payslip, WeekAssignment } from "@/lib/payroll/types";

export type WeekClassifyInput = {
  countryCode?: CountryCode;
  weekNumber?: number | null;
  paymentDate: string;
  payPeriodStart?: string | null;
  payPeriodEnd?: string | null;
  employmentWeeks?: number | null;
  payFrequency?: Payslip["payFrequency"];
};

const UNASSIGNED: WeekAssignment = {
  countryCode: "IE",
  year: null,
  weekNumber: null,
  basis: "insufficient",
  derived: false,
  verification_status: "needs_review",
  confidence: 0,
  reason:
    "Not enough reliable information on the document to assign a work week. The week is not guessed from the pay date.",
};

/**
 * Assign a payslip to a work/pay week using only document-backed facts.
 * Pay date alone is never used: it is often after the working week.
 */
export function classifyWorkWeek(input: WeekClassifyInput): WeekAssignment {
  const country = input.countryCode ?? "IE";
  if (country !== "IE") {
    return {
      ...UNASSIGNED,
      countryCode: country,
      reason: "Week classification for this country is not implemented. The week is not guessed.",
    };
  }
  return classifyIrishWorkWeek(input);
}

function classifyIrishWorkWeek(input: WeekClassifyInput): WeekAssignment {
  const printed = printedWeek(input.weekNumber);
  if (printed != null) {
    return assignmentFromPrintedWeek(input, printed);
  }

  const start = input.payPeriodStart || null;
  const end = input.payPeriodEnd || null;

  if (coversMultipleWeeks(input, start, end)) {
    return {
      ...UNASSIGNED,
      reason:
        "This payslip covers more than one week (frequency, insurable weeks, or period length). It is not assigned to a single week.",
    };
  }

  if (start && end) {
    const startWeek = irishTaxWeek(start);
    const endWeek = irishTaxWeek(end);
    if (!startWeek || !endWeek) {
      return {
        ...UNASSIGNED,
        reason: "Pay period dates are present but could not be read as calendar dates. The week is not guessed.",
      };
    }
    if (startWeek.year === endWeek.year && startWeek.week === endWeek.week) {
      return {
        countryCode: "IE",
        year: startWeek.year,
        weekNumber: startWeek.week,
        basis: "period_dates",
        derived: true,
        verification_status: "derived",
        confidence: 0.9,
        reason: `Derived Irish tax week ${startWeek.week} of ${startWeek.year} because the pay period sits inside that week. This week number was not printed on the slip.`,
      };
    }
    return {
      ...UNASSIGNED,
      reason:
        "The pay period spans more than one Irish tax week. TruckPay does not pick a week. Enter the week number as printed if it appears on the slip.",
    };
  }

  if (start && !end) {
    const week = irishTaxWeek(start);
    if (!week) return { ...UNASSIGNED };
    return {
      countryCode: "IE",
      year: week.year,
      weekNumber: week.week,
      basis: "period_start",
      derived: true,
      verification_status: "derived",
      confidence: 0.7,
      reason: `Derived Irish tax week ${week.week} of ${week.year} from the pay period start only. Period end was not on the document.`,
    };
  }

  if (end && !start) {
    const week = irishTaxWeek(end);
    if (!week) return { ...UNASSIGNED };
    return {
      countryCode: "IE",
      year: week.year,
      weekNumber: week.week,
      basis: "period_end",
      derived: true,
      verification_status: "derived",
      confidence: 0.7,
      reason: `Derived Irish tax week ${week.week} of ${week.year} from the pay period end only. Period start was not on the document.`,
    };
  }

  return {
    ...UNASSIGNED,
    reason:
      "Only a payment date is available (or dates are missing). Payment date is not used to assign a work week because it is often after the week worked.",
  };
}

function assignmentFromPrintedWeek(input: WeekClassifyInput, printed: number): WeekAssignment {
  const yearDate = input.payPeriodStart || input.payPeriodEnd || input.paymentDate;
  const tax = irishTaxWeek(yearDate);
  const year = tax?.year ?? Number(yearDate.slice(0, 4));
  const month = Number((input.payPeriodStart || input.payPeriodEnd || input.paymentDate).slice(5, 7));
  const yearBoundary =
    (printed >= 52 && month === 1) || (printed <= 2 && month === 12);

  if (yearBoundary || !Number.isFinite(year)) {
    return {
      countryCode: "IE",
      year: Number.isFinite(year) ? year : null,
      weekNumber: printed,
      basis: "printed_week_number",
      derived: false,
      verification_status: "needs_review",
      confidence: 0.5,
      reason:
        "A week number is printed on the document but the calendar year is ambiguous around the year boundary. The year is not guessed.",
    };
  }

  const multi = coversMultipleWeeks(input, input.payPeriodStart || null, input.payPeriodEnd || null);
  return {
    countryCode: "IE",
    year,
    weekNumber: printed,
    basis: "printed_week_number",
    derived: false,
    verification_status: multi ? "needs_review" : "source",
    confidence: multi ? 0.6 : 1,
    reason: multi
      ? `Week ${printed} is printed on the document, but the slip also looks like it covers more than one week. Stored as printed; not treated as a single-week total.`
      : `Week ${printed} of ${year} as printed on the document.`,
  };
}

function printedWeek(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isInteger(value) || value < 1 || value > 53) return null;
  return value;
}

function coversMultipleWeeks(
  input: WeekClassifyInput,
  start: string | null,
  end: string | null,
): boolean {
  if (input.employmentWeeks != null && input.employmentWeeks > 1) return true;
  if (input.payFrequency === "fortnightly" || input.payFrequency === "lunar" || input.payFrequency === "monthly") {
    return true;
  }
  if (start && end) {
    const days = inclusivePeriodDays(start, end);
    if (days != null && days > 8) return true;
  }
  return false;
}

export function weekAssignmentKey(assignment: WeekAssignment): string | null {
  if (assignment.year == null || assignment.weekNumber == null) return null;
  if (assignment.verification_status === "needs_review" && assignment.basis === "insufficient") return null;
  if (assignment.weekNumber == null) return null;
  return `${assignment.year}-W${String(assignment.weekNumber).padStart(2, "0")}`;
}
