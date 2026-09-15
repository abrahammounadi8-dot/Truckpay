"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { employerLabel } from "@/lib/payroll/employer";
import { formatEuro, formatEuroMaybe } from "@/lib/payroll/format";
import { classifyWorkWeek } from "@/lib/payroll/week";
import {
  ANOMALY_STATUS_LABELS,
  DEDUCTION_LABELS,
  FREQUENCY_LABELS,
  WEEK_STATUS_LABELS,
  type Anomaly,
  type Epistemic,
  type Finding,
  type Payslip,
  type ProvenanceField,
} from "@/lib/payroll/types";
import { cn } from "@/lib/utils";

type PublicPayslip = Omit<Payslip, "userId">;

const epistemicLabel: Record<Epistemic, string> = {
  fact: "Fact",
  inference: "Inference",
  unknown: "Unknown",
};

export function PayslipDetail({
  slip,
  findings,
  anomalies = [],
}: {
  slip: PublicPayslip;
  findings: Finding[];
  anomalies?: Anomaly[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/payslips/${slip.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.ok) {
        router.push("/payslips");
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not delete this slip.");
    } catch {
      setError("Could not delete this slip.");
    }
    setPending(false);
  }

  const employer = employerLabel(slip);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Private · Ireland
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Paid {slip.paymentDate}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {FREQUENCY_LABELS[slip.payFrequency]}
            {employer ? ` · ${employer}` : " · employer not on the slip"}
            {slip.payPeriodStart && slip.payPeriodEnd
              ? ` · ${slip.payPeriodStart} → ${slip.payPeriodEnd}`
              : ""}
            {slip.weekNumber != null ? ` · printed week ${slip.weekNumber}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={pending} onClick={onDelete}>
          {pending ? "Deleting…" : "Delete this slip"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <WeekBanner slip={slip} />

      <div className="stub-paper rounded-xl p-5 ring-1 ring-foreground/10">
        <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Net on this slip
        </p>
        <p className="font-heading mt-1 text-5xl font-semibold tabular-nums">
          {formatEuroMaybe(slip.netPay)}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Item label="Gross" value={formatEuroMaybe(slip.grossPay)} />
          <Item label="Basic pay" value={formatEuroMaybe(slip.basicPay)} />
          <Item label="Overtime pay" value={formatEuroMaybe(slip.overtimePay)} />
          <Item
            label="Insurable weeks"
            value={slip.employmentWeeks != null ? String(slip.employmentWeeks) : "—"}
          />
        </dl>
      </div>

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl font-semibold">Hours and rates</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Figures below are from the document unless marked derived. Blank fields stay blank — TruckPay does not guess.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <ProvenanceItem label="Basic hours" field={slip.provenance?.basicHours} fallback={n(slip.basicHours)} />
          <ProvenanceItem label="Basic rate" field={slip.provenance?.hourlyRate} fallback={formatEuroMaybe(slip.basicRate)} money />
          <Item label="Basic pay" value={formatEuroMaybe(slip.basicPay)} />
          <ProvenanceItem label="Overtime hours" field={slip.provenance?.overtimeHours} fallback={n(slip.overtimeHours)} />
          <ProvenanceItem label="Overtime rate" field={slip.provenance?.overtimeRate} fallback={formatEuroMaybe(slip.overtimeRate)} money />
          <Item label="Overtime pay" value={formatEuroMaybe(slip.overtimePay)} />
          <ProvenanceItem label="Holiday pay" field={slip.provenance?.holidayPay} fallback={formatEuroMaybe(slip.holidayPay ?? null)} money />
          <ProvenanceItem label="Tax (PAYE lines)" field={slip.provenance?.tax} fallback="—" money />
          <ProvenanceItem label="PRSI" field={slip.provenance?.prsi} fallback="—" money />
          <ProvenanceItem label="USC" field={slip.provenance?.usc} fallback="—" money />
          <ProvenanceItem label="Pension" field={slip.provenance?.pension} fallback="—" money />
          <Item label="Cumulative gross" value={formatEuroMaybe(slip.cumulativeGross)} />
          <Item label="Cumulative tax" value={formatEuroMaybe(slip.cumulativeTax)} />
          <Item label="Cumulative PRSI" value={formatEuroMaybe(slip.cumulativePrsi ?? null)} />
          <Item label="Cumulative USC" value={formatEuroMaybe(slip.cumulativeUsc ?? null)} />
          <Item label="Cumulative pension" value={formatEuroMaybe(slip.cumulativePension ?? null)} />
          <Item label="YTD insurable weeks" value={n(slip.totalInsurableWeeks)} />
        </dl>
      </section>

      <ExpectedPay record={slip.weeklyRecord} />

      <Lines title="Allowances" rows={slip.allowances.map((line) => ({
        label: line.rawLabel,
        amount: line.amount,
        meta: line.needsReview ? "Needs review" : line.normalizedCategory,
      }))} />

      <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-xl font-semibold">Deductions</h2>
        {slip.deductions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None entered.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {slip.deductions.map((line) => (
              <li key={`${line.rawLabel}-${line.amount}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium">{line.rawLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {DEDUCTION_LABELS[line.normalizedCategory]} · {line.statutoryClass.replaceAll("_", " ")}
                    {line.needsReview ? " · needs review" : ""}
                  </p>
                </div>
                <p className="font-mono text-sm tabular-nums">{formatEuro(line.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Anomaly watch</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Confirmed only with enough evidence. Otherwise TruckPay uses possible anomaly, needs review, or
          insufficient data. Nothing here is an accusation.
        </p>
        {anomalies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-sm text-muted-foreground">
            No anomaly flags on the figures you entered.
          </p>
        ) : (
          <ul className="space-y-3">
            {anomalies.map((item) => (
              <li key={item.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.status === "confirmed" ? "default" : item.status === "insufficient_data" ? "secondary" : "destructive"}>
                    {ANOMALY_STATUS_LABELS[item.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.kind.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-2 text-sm leading-6">{item.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Checks</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every note is labelled Fact, Inference, or Unknown, with the figures it used. Truckpay does
          not accuse an employer of wrongdoing from an anomaly.
        </p>
        {findings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-sm text-muted-foreground">
            No arithmetic gaps or unknown labels on the figures you entered.
          </p>
        ) : (
          <ul className="space-y-3">
            {findings.map((finding) => (
              <li key={finding.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={finding.epistemic === "fact" ? "default" : finding.epistemic === "unknown" ? "destructive" : "secondary"}>
                    {epistemicLabel[finding.epistemic]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    confidence {Math.round(finding.confidence * 100)}%
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6">{finding.summary}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {finding.evidence.fields.join(" · ")}
                  {finding.evidence.expected != null
                    ? ` · expected ${evidenceValue(finding, finding.evidence.expected)}`
                    : ""}
                  {finding.evidence.actual != null
                    ? ` · on slip ${evidenceValue(finding, finding.evidence.actual)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/payslips" className={cn(buttonVariants({ variant: "outline" }))}>
        Back to my slips
      </Link>
    </div>
  );
}

function WeekBanner({ slip }: { slip: PublicPayslip }) {
  const assignment =
    slip.weekAssignment ??
    classifyWorkWeek({
      countryCode: slip.countryCode,
      weekNumber: slip.weekNumber,
      paymentDate: slip.paymentDate,
      payPeriodStart: slip.payPeriodStart,
      payPeriodEnd: slip.payPeriodEnd,
      employmentWeeks: slip.employmentWeeks,
      payFrequency: slip.payFrequency,
    });
  const title =
    assignment.weekNumber != null && assignment.year != null
      ? `Week ${assignment.weekNumber} of ${assignment.year}`
      : "Week not assigned";
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-heading text-lg font-semibold">{title}</p>
        <Badge variant={assignment.verification_status === "source" ? "default" : assignment.verification_status === "derived" ? "secondary" : "destructive"}>
          {WEEK_STATUS_LABELS[assignment.verification_status]}
        </Badge>
        {assignment.derived ? <span className="text-xs text-muted-foreground">Derived — not printed as a week number</span> : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{assignment.reason}</p>
    </section>
  );
}

function ExpectedPay({ record }: { record: PublicPayslip["weeklyRecord"] }) {
  if (!record) return null;
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl font-semibold">Expected vs actual (this week)</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Expected pay is derived from hours × rates when those figures are on the document. It is never
        presented as a printed payslip amount.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <Item label="Actual gross (source)" value={formatEuroMaybe(record.actual.grossPay)} />
        <Item
          label="Expected gross (derived)"
          value={record.expected.grossPay == null ? "Not calculated" : formatEuro(record.expected.grossPay)}
        />
        <Item label="Variance" value={record.variance == null ? "—" : formatEuro(record.variance)} />
      </dl>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{record.expected.reason}</p>
    </section>
  );
}

function ProvenanceItem({
  label,
  field,
  fallback,
  money,
}: {
  label: string;
  field: ProvenanceField<number | string> | undefined;
  fallback: string;
  money?: boolean;
}) {
  const display =
    field == null || field.value == null
      ? fallback
      : money && typeof field.value === "number"
        ? formatEuro(field.value)
        : String(field.value);
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">{display}</dd>
      {field ? (
        <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
          {WEEK_STATUS_LABELS[field.verification_status]}
        </p>
      ) : null}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function Lines({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; amount: number; meta: string }[];
}) {
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">None entered.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((row) => (
            <li key={`${row.label}-${row.amount}`} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span>
                {row.label}
                <span className="ml-2 text-xs text-muted-foreground">{row.meta}</span>
              </span>
              <span className="font-mono tabular-nums">{formatEuro(row.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function n(value: number | null): string {
  return value == null ? "—" : String(value);
}

function evidenceValue(finding: Finding, value: number): string {
  if (finding.kind === "multi_week_payment") return String(value);
  return formatEuro(value);
}
