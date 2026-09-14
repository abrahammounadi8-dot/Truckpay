import type { Finding, FindingKind, Payslip } from "@/lib/payroll/types";

const MONEY_EPS = 0.05;

function money(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function product(a: number, b: number) {
  return Math.round(a * b * 100) / 100;
}

function periodDays(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Neutral checks only. An anomaly is never worded as employer wrongdoing.
 */
export function reconcilePayslip(slip: Payslip, prior: Payslip[]): Finding[] {
  const findings: Finding[] = [];

  pushArithmetic(findings, slip, "basic", slip.basicHours, slip.basicRate, slip.basicPay);
  pushArithmetic(findings, slip, "overtime", slip.overtimeHours, slip.overtimeRate, slip.overtimePay);

  const days = periodDays(slip.payPeriodStart, slip.payPeriodEnd);
  const multiWeek =
    (slip.employmentWeeks != null && slip.employmentWeeks > 1) ||
    slip.payFrequency === "fortnightly" ||
    slip.payFrequency === "lunar" ||
    slip.payFrequency === "monthly" ||
    (days != null && days > 8);

  if (multiWeek) {
    findings.push(
      make(
        slip.id,
        "multi_week_payment",
        "fact",
        0.95,
        "This payslip is not treated as a single working week. Payment may cover more than one week, a lunar/monthly cycle, or more than one insurable week.",
        {
          fields: ["payFrequency", "employmentWeeks", "payPeriodStart", "payPeriodEnd"],
          expected: 1,
          actual: slip.employmentWeeks ?? days,
          note: "One slip ≠ one week.",
        },
      ),
    );
  }

  if (money(slip.grossPay) && money(slip.netPay)) {
    const deducted = slip.deductions.reduce((sum, line) => sum + line.amount, 0);
    const impliedNet = Math.round((slip.grossPay - deducted) * 100) / 100;
    if (Math.abs(impliedNet - slip.netPay) > MONEY_EPS) {
      findings.push(
        make(
          slip.id,
          "gross_net_gap",
          "inference",
          0.6,
          "Gross minus the listed deductions does not equal net. A line may be missing, grouped, or labelled differently on the provider’s slip. This is not a finding of wrongdoing.",
          {
            fields: ["grossPay", "netPay", "deductions"],
            expected: impliedNet,
            actual: slip.netPay,
            note: "Providers do not use the same labels.",
          },
        ),
      );
    }
  }

  for (const line of slip.deductions) {
    if (line.normalizedCategory === "UNKNOWN" || line.needsReview) {
      findings.push(
        make(
          slip.id,
          "unknown_deduction",
          "unknown",
          line.confidenceScore,
          `Deduction “${line.rawLabel}” is kept as written and flagged for review. It is not classified as incorrect or unlawful.`,
          {
            fields: ["deductions.rawLabel"],
            expected: null,
            actual: line.amount,
            note: line.rawLabel,
          },
        ),
      );
    }
  }

  const previousSameEmployer = prior.filter(
    (item) => item.employerSlug && item.employerSlug === slip.employerSlug && item.id !== slip.id,
  );
  const last = previousSameEmployer[0];
  if (last && money(last.basicRate) && money(slip.basicRate) && last.basicRate !== slip.basicRate) {
    findings.push(
      make(
        slip.id,
        "rate_change",
        "inference",
        0.7,
        "The basic hourly rate on this slip differs from the previous slip for the same listed firm. Rates change for many lawful reasons. This is a difference, not an accusation.",
        {
          fields: ["basicRate"],
          expected: last.basicRate,
          actual: slip.basicRate,
          note: "Compared to the prior slip for this employer slug only.",
        },
      ),
    );
  }

  if (last) {
    const priorLabels = new Set(last.deductions.map((line) => line.rawLabel.trim().toLowerCase()));
    for (const line of slip.deductions) {
      const key = line.rawLabel.trim().toLowerCase();
      if (!key) continue;
      if (priorLabels.has(key)) {
        if (line.normalizedCategory !== "PAYE" && line.normalizedCategory !== "PRSI" && line.normalizedCategory !== "USC") {
          findings.push(
            make(
              slip.id,
              "recurring_deduction",
              "inference",
              0.55,
              `“${line.rawLabel}” also appeared on the previous slip. Recurring lines are noted so you can check them. Repetition is not proof of an error.`,
              {
                fields: ["deductions.rawLabel"],
                expected: null,
                actual: line.amount,
                note: line.rawLabel,
              },
            ),
          );
        }
      } else if (
        line.normalizedCategory !== "PAYE" &&
        line.normalizedCategory !== "PRSI" &&
        line.normalizedCategory !== "USC"
      ) {
        findings.push(
          make(
            slip.id,
            "new_deduction",
            "fact",
            0.8,
            `“${line.rawLabel}” did not appear on the previous slip. It is flagged as new so you can check it. A new line is not classified as illegal.`,
            {
              fields: ["deductions.rawLabel"],
              expected: null,
              actual: line.amount,
              note: line.rawLabel,
            },
          ),
        );
      }
    }
  }

  return findings;
}

function pushArithmetic(
  findings: Finding[],
  slip: Payslip,
  which: "basic" | "overtime",
  hours: number | null,
  rate: number | null,
  pay: number | null,
) {
  if (!money(hours) || !money(rate) || !money(pay)) return;
  const expected = product(hours, rate);
  if (Math.abs(expected - pay) <= MONEY_EPS) return;
  const kind: FindingKind = which === "basic" ? "arithmetic_basic" : "arithmetic_overtime";
  findings.push(
    make(
      slip.id,
      kind,
      "fact",
      0.9,
      `${which === "basic" ? "Basic" : "Overtime"} hours × rate does not equal the ${which} pay figure on this slip. That can be rounding, a blended rate, holiday pay, or a line that sits elsewhere. Truckpay does not treat this as employer wrongdoing.`,
      {
        fields:
          which === "basic"
            ? ["basicHours", "basicRate", "basicPay"]
            : ["overtimeHours", "overtimeRate", "overtimePay"],
        expected,
        actual: pay,
        note: "Arithmetic on the figures you entered.",
      },
    ),
  );
}

function make(
  payslipId: string,
  kind: FindingKind,
  epistemic: Finding["epistemic"],
  confidence: number,
  summary: string,
  evidence: Finding["evidence"],
): Finding {
  return {
    id: crypto.randomUUID(),
    payslipId,
    kind,
    epistemic,
    confidence,
    summary,
    evidence,
  };
}
