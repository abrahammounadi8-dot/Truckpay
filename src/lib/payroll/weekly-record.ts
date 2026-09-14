import type { Payslip, PayslipProvenance, WeeklyNormalizedRecord } from "@/lib/payroll/types";

const MONEY_EPS = 0.05;

function money(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function product(hours: number, rate: number) {
  return Math.round(hours * rate * 100) / 100;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Normalized week row for later EXPECTED vs ACTUAL comparison.
 * Expected gross is calculated only from verified source hours/rates.
 * It is never copied from printed gross and never invented.
 */
export function buildWeeklyRecord(slip: Payslip, provenance: PayslipProvenance): WeeklyNormalizedRecord {
  const assignment = slip.weekAssignment;
  const weekAssigned =
    assignment != null &&
    assignment.weekNumber != null &&
    assignment.year != null &&
    assignment.verification_status !== "needs_review";

  const expected = expectedGrossFromSource(slip, provenance);
  const actualGross = provenance.grossPay.source === "source" ? provenance.grossPay.value : null;

  return {
    payslipId: slip.id,
    countryCode: slip.countryCode,
    year: assignment?.year ?? null,
    weekNumber: assignment?.weekNumber ?? null,
    weekAssigned,
    actual: {
      grossPay: actualGross,
      netPay: provenance.netPay.source === "source" ? provenance.netPay.value : null,
      basicHours: provenance.basicHours.source === "source" ? provenance.basicHours.value : null,
      overtimeHours: provenance.overtimeHours.source === "source" ? provenance.overtimeHours.value : null,
      hourlyRate: provenance.hourlyRate.source === "source" ? provenance.hourlyRate.value : null,
      overtimeRate: provenance.overtimeRate.source === "source" ? provenance.overtimeRate.value : null,
      holidayPay: provenance.holidayPay.source === "source" ? provenance.holidayPay.value : null,
      allowancesTotal: provenance.allowances.source === "source" || provenance.allowances.derived ? provenance.allowances.value : null,
    },
    expected: {
      grossPay: expected.grossPay,
      status: expected.grossPay == null ? "insufficient_data" : "calculated",
      derived: true,
      reason: expected.reason,
      components: expected.components,
    },
    comparable: weekAssigned && expected.grossPay != null && actualGross != null,
    variance:
      expected.grossPay != null && actualGross != null ? round2(actualGross - expected.grossPay) : null,
    varianceNote:
      expected.grossPay != null && actualGross != null
        ? Math.abs(actualGross - expected.grossPay) <= MONEY_EPS
          ? "Actual gross matches derived expected gross within rounding."
          : "Actual gross differs from derived expected gross. Difference is not classified as employer wrongdoing."
        : null,
  };
}

function expectedGrossFromSource(
  slip: Payslip,
  provenance: PayslipProvenance,
): {
  grossPay: number | null;
  reason: string;
  components: WeeklyNormalizedRecord["expected"]["components"];
} {
  const empty = {
    basic: null as number | null,
    overtime: null as number | null,
    allowances: null as number | null,
    holidayPay: null as number | null,
  };

  if (provenance.basicHours.source !== "source" || !money(slip.basicHours)) {
    return {
      grossPay: null,
      reason: "Expected pay is not calculated: basic hours are not on the document.",
      components: empty,
    };
  }
  if (provenance.hourlyRate.source !== "source" || !money(slip.basicRate)) {
    return {
      grossPay: null,
      reason: "Expected pay is not calculated: hourly rate is not on the document.",
      components: empty,
    };
  }
  if (provenance.overtimeHours.source !== "source" || !money(slip.overtimeHours)) {
    return {
      grossPay: null,
      reason: "Expected pay is not calculated: overtime hours are unknown. Zero overtime is not assumed.",
      components: empty,
    };
  }
  if (slip.overtimeHours > 0 && (provenance.overtimeRate.source !== "source" || !money(slip.overtimeRate))) {
    return {
      grossPay: null,
      reason: "Expected pay is not calculated: overtime hours are present but the overtime rate is not on the document.",
      components: empty,
    };
  }

  const basic = product(slip.basicHours, slip.basicRate);
  const overtime = slip.overtimeHours === 0 ? 0 : product(slip.overtimeHours, slip.overtimeRate!);
  const allowances = slip.allowances.reduce((sum, line) => sum + line.amount, 0);
  const holiday = money(slip.holidayPay) ? slip.holidayPay : 0;
  const grossPay = round2(basic + overtime + allowances + holiday);

  const holidayNote = money(slip.holidayPay)
    ? " Holiday pay printed on the slip is included."
    : " Holiday pay was not a separate printed figure and is not assumed.";

  return {
    grossPay,
    reason: `Derived from source hours × rates plus listed allowances.${holidayNote} This figure was not printed on the payslip.`,
    components: {
      basic,
      overtime,
      allowances,
      holidayPay: money(slip.holidayPay) ? slip.holidayPay : null,
    },
  };
}
