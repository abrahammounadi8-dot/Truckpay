"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { fleet } from "@/lib/data";
import { formatEuro, formatEuroMaybe } from "@/lib/payroll/format";
import {
  DEDUCTION_LABELS,
  FREQUENCY_LABELS,
  type Epistemic,
  type Finding,
  type Payslip,
} from "@/lib/payroll/types";
import { cn } from "@/lib/utils";

type PublicPayslip = Omit<Payslip, "userId">;

const epistemicLabel: Record<Epistemic, string> = {
  fact: "Fact",
  inference: "Inference",
  unknown: "Unknown",
};

export function PayslipDetail({ id }: { id: string }) {
  const router = useRouter();
  const [slip, setSlip] = useState<PublicPayslip | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch(`/api/payslips/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("not found"))))
      .then((data: { payslip: PublicPayslip; findings: Finding[] }) => {
        setSlip(data.payslip);
        setFindings(data.findings);
      })
      .catch(() => setError("This payslip is not on this device."));
  }, [id]);

  async function onDelete() {
    setPending(true);
    const res = await fetch(`/api/payslips/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/payslips");
    else setPending(false);
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!slip) {
    return <p className="text-sm text-muted-foreground">Opening slip…</p>;
  }

  const employer = slip.employerSlug
    ? fleet.find((company) => company.slug === slip.employerSlug)
    : null;

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
            {employer ? ` · ${employer.name}` : " · employer not linked"}
            {slip.payPeriodStart && slip.payPeriodEnd
              ? ` · ${slip.payPeriodStart} → ${slip.payPeriodEnd}`
              : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={pending} onClick={onDelete}>
          {pending ? "Deleting…" : "Delete this slip"}
        </Button>
      </div>

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
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Item label="Basic hours" value={n(slip.basicHours)} />
          <Item label="Basic rate" value={formatEuroMaybe(slip.basicRate)} />
          <Item label="Basic pay" value={formatEuroMaybe(slip.basicPay)} />
          <Item label="Overtime hours" value={n(slip.overtimeHours)} />
          <Item label="Overtime rate" value={formatEuroMaybe(slip.overtimeRate)} />
          <Item label="Overtime pay" value={formatEuroMaybe(slip.overtimePay)} />
          <Item label="Cumulative gross" value={formatEuroMaybe(slip.cumulativeGross)} />
          <Item label="Cumulative tax" value={formatEuroMaybe(slip.cumulativeTax)} />
          <Item label="YTD insurable weeks" value={n(slip.totalInsurableWeeks)} />
        </dl>
      </section>

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
