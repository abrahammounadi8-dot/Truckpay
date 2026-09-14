import { findDuplicate } from "@/lib/payroll/fingerprint";
import { reconcilePayslip } from "@/lib/payroll/reconcile";
import { inspectSequence } from "@/lib/payroll/sequence";
import { weekAssignmentKey } from "@/lib/payroll/week";
import type {
  Anomaly,
  AnomalyKind,
  AnomalyStatus,
  EmploymentProfile,
  Payslip,
} from "@/lib/payroll/types";

function money(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function make(
  kind: AnomalyKind,
  status: AnomalyStatus,
  payslipId: string | null,
  summary: string,
  fields: string[],
  note: string,
): Anomaly {
  return {
    id: `${kind}:${payslipId ?? "set"}:${fields.join(",")}`,
    kind,
    status,
    payslipId,
    summary,
    evidence: { fields, note },
  };
}

/** Per-slip anomaly foundation. Confirmed only with sufficient evidence. */
export function detectPayslipAnomalies(slip: Payslip, prior: Payslip[], profile: EmploymentProfile | null): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (slip.basicHours == null) {
    anomalies.push(
      make(
        "missing_hours",
        "insufficient_data",
        slip.id,
        "Basic hours are not on this payslip. Missing hours are not confirmed.",
        ["basicHours"],
        "No hours figure was extracted.",
      ),
    );
  } else if (
    slip.basicHours === 0 &&
    money(slip.grossPay) &&
    slip.grossPay > 0 &&
    (slip.overtimeHours == null || slip.overtimeHours === 0) &&
    slip.allowances.length === 0 &&
    slip.holidayPay == null
  ) {
    anomalies.push(
      make(
        "missing_hours",
        "possible_anomaly",
        slip.id,
        "Gross pay is present but basic hours are recorded as zero, with no overtime, allowances or holiday pay on file. This may be a salary slip or incomplete extraction — not confirmed as missing hours.",
        ["basicHours", "grossPay"],
        "Zero hours with positive gross.",
      ),
    );
  }

  if (slip.basicRate == null) {
    anomalies.push(
      make(
        "incorrect_hourly_rate",
        "insufficient_data",
        slip.id,
        "Hourly rate is not on this payslip, so it cannot be checked.",
        ["basicRate"],
        "No rate figure was extracted.",
      ),
    );
  } else if (profile?.agreedBaseRate != null && profile.agreedBaseRate !== slip.basicRate) {
    const documentRate = profile.tenureSource === "employment_contract" || profile.tenureSource === "other_verified_document";
    anomalies.push(
      make(
        "incorrect_hourly_rate",
        documentRate ? "possible_anomaly" : "insufficient_data",
        slip.id,
        documentRate
          ? "The hourly rate on this slip differs from the rate on a document-backed employment profile. Rates change for many lawful reasons. This is not confirmed as an incorrect rate."
          : "A profile rate exists but is not document-verified, so a rate difference is not treated as an anomaly.",
        ["basicRate", "agreedBaseRate"],
        "Compared only when a profile rate is on file.",
      ),
    );
  }

  if (slip.overtimeHours == null) {
    anomalies.push(
      make(
        "unpaid_overtime",
        "insufficient_data",
        slip.id,
        "Overtime hours are not on this payslip. Unpaid overtime is not assumed or confirmed.",
        ["overtimeHours"],
        "No overtime hours figure.",
      ),
    );
  } else if (slip.overtimeHours > 0 && slip.overtimeRate == null && slip.overtimePay == null) {
    anomalies.push(
      make(
        "unpaid_overtime",
        "insufficient_data",
        slip.id,
        "Overtime hours are present but overtime rate and overtime pay are not. Unpaid overtime cannot be confirmed.",
        ["overtimeHours", "overtimeRate", "overtimePay"],
        "Hours without rate or pay.",
      ),
    );
  } else if (slip.overtimeHours > 0 && (slip.overtimeRate === 0 || slip.overtimePay === 0)) {
    anomalies.push(
      make(
        "unpaid_overtime",
        "possible_anomaly",
        slip.id,
        "Overtime hours are present and the overtime rate or overtime pay is recorded as zero. This may be unpaid overtime, a blended rate, or a line held elsewhere. Not confirmed.",
        ["overtimeHours", "overtimeRate", "overtimePay"],
        "Positive overtime hours with a zero overtime figure.",
      ),
    );
  }

  for (const line of slip.deductions) {
    if (line.normalizedCategory === "UNKNOWN" || line.needsReview) {
      anomalies.push(
        make(
          "unexpected_deduction",
          "needs_review",
          slip.id,
          `Deduction “${line.rawLabel}” is kept as written and needs review. It is not classified as incorrect or unlawful.`,
          ["deductions.rawLabel"],
          "Unknown or low-confidence label.",
        ),
      );
    }
  }

  if (slip.weekAssignment?.verification_status === "needs_review" && slip.weekAssignment.weekNumber == null) {
    anomalies.push(
      make(
        "missing_week",
        "needs_review",
        slip.id,
        "This payslip could not be assigned to a work week from the document. The week was not guessed.",
        ["weekAssignment"],
        slip.weekAssignment.reason,
      ),
    );
  }

  const findings = reconcilePayslip(slip, prior);
  for (const finding of findings) {
    if (finding.kind === "rate_change") {
      anomalies.push(
        make(
          "payslip_inconsistency",
          "possible_anomaly",
          slip.id,
          "The basic hourly rate differs from the previous slip for the same employer. This is a difference, not a confirmed error.",
          ["basicRate"],
          finding.evidence.note,
        ),
      );
    }
  }

  return anomalies;
}

/** Set-level duplicates, missing weeks, and cross-slip inconsistencies. */
export function detectSetAnomalies(slips: Payslip[], profile: EmploymentProfile | null): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const sorted = [...slips].sort(
    (a, b) => a.paymentDate.localeCompare(b.paymentDate) || a.createdAt.localeCompare(b.createdAt),
  );

  for (const slip of sorted) {
    const others = sorted.filter((item) => item.id !== slip.id);
    const duplicate = findDuplicate(others, slip.contentHash);
    if (duplicate) {
      anomalies.push(
        make(
          "duplicate_payslip",
          "confirmed",
          slip.id,
          "This payslip matches another stored slip (same dates and totals). Duplicate content is confirmed.",
          ["contentHash"],
          `Matches payslip ${duplicate.id}.`,
        ),
      );
    }
  }

  const assigned = sorted
    .map((slip) => ({
      slip,
      key: slip.weekAssignment ? weekAssignmentKey(slip.weekAssignment) : null,
    }))
    .filter(
      (row) =>
        row.key &&
        row.slip.weekAssignment &&
        row.slip.weekAssignment.verification_status !== "needs_review",
    );

  const byYear = new Map<number, { week: number; id: string }[]>();
  for (const row of assigned) {
    const year = row.slip.weekAssignment!.year;
    const week = row.slip.weekAssignment!.weekNumber;
    if (year == null || week == null) continue;
    const list = byYear.get(year) ?? [];
    list.push({ week, id: row.slip.id });
    byYear.set(year, list);
  }
  for (const [year, rows] of byYear) {
    const unique = [...new Set(rows.map((row) => row.week))].sort((a, b) => a - b);
    for (let i = 0; i < unique.length - 1; i += 1) {
      const current = unique[i]!;
      const next = unique[i + 1]!;
      if (next - current > 1) {
        const missing = [];
        for (let week = current + 1; week < next; week += 1) missing.push(week);
        anomalies.push(
          make(
            "missing_week",
            "possible_anomaly",
            rows.find((row) => row.week === next)?.id ?? null,
            `Irish tax weeks ${missing.join(", ")} of ${year} are not on file between week ${current} and week ${next}. A gap is not confirmed as unpaid work — the driver may not have worked those weeks.`,
            ["weekAssignment"],
            `Possible missing weeks: ${missing.join(", ")}.`,
          ),
        );
      }
    }
  }

  const sequence = inspectSequence(sorted);
  if (!sequence.periodsExtracted && sorted.length >= 2) {
    anomalies.push(
      make(
        "missing_week",
        "insufficient_data",
        sorted[0]?.id ?? null,
        "Pay periods are missing on one or more slips, so missing weeks cannot be confirmed from dates.",
        ["payPeriodStart", "payPeriodEnd"],
        "Sequence inspector needs extracted periods.",
      ),
    );
  }

  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (!a.employerSlug || a.employerSlug !== b.employerSlug) continue;
      if (!a.payPeriodStart || !a.payPeriodEnd || !b.payPeriodStart || !b.payPeriodEnd) continue;
      if (periodsOverlap(a.payPeriodStart, a.payPeriodEnd, b.payPeriodStart, b.payPeriodEnd)) {
        if (a.grossPay != null && b.grossPay != null && a.grossPay !== b.grossPay) {
          anomalies.push(
            make(
              "payslip_inconsistency",
              "possible_anomaly",
              b.id,
              "Two slips for the same employer have overlapping pay periods and different gross pay. This needs a check; it is not confirmed as an error.",
              ["payPeriodStart", "payPeriodEnd", "grossPay"],
              "Overlapping periods.",
            ),
          );
        }
      }
    }
  }

  for (const slip of sorted) {
    const prior = sorted.filter((item) => item.id !== slip.id);
    anomalies.push(...detectPayslipAnomalies(slip, prior, profile));
  }

  return dedupe(anomalies);
}

function periodsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function dedupe(anomalies: Anomaly[]): Anomaly[] {
  const seen = new Set<string>();
  const out: Anomaly[] = [];
  for (const item of anomalies) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
