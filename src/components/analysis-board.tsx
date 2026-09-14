"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { SetAnalysis } from "@/lib/payroll/analysis";
import type { CompanyPayStats } from "@/lib/payroll/company-stats";
import type { PayFactor } from "@/lib/payroll/explain";
import { formatEuroMaybe, payslipTitle } from "@/lib/payroll/format";
import {
  FREQUENCY_LABELS,
  REQUIRED_PAYSLIPS,
  TENURE_BAND_LABELS,
  TENURE_SOURCE_LABELS,
  type EmploymentProfile,
  type Payslip,
} from "@/lib/payroll/types";
import { cn } from "@/lib/utils";

type Payload = {
  analysis: Omit<SetAnalysis, "latest"> & { latest: Omit<Payslip, "userId">[] };
  profile: Omit<EmploymentProfile, "userId"> | null;
  companyStats: CompanyPayStats | null;
  factors: PayFactor[];
};

export function AnalysisBoard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analysis", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Analysis could not be loaded."));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Reading your latest slips…</p>;

  const { analysis, profile, companyStats, factors } = data;
  const remaining = Math.max(0, analysis.required - analysis.have);

  return (
    <div className="space-y-8">
      <div className="stub-paper rounded-xl p-5 ring-1 ring-foreground/10">
        {analysis.verifiedLabel ? (
          <>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-pay-up uppercase">
              {analysis.verifiedLabel}
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">Latest {REQUIRED_PAYSLIPS} slips checked</p>
            <p className="mt-2 text-sm text-muted-foreground">
              One payslip is not treated as one working week. Weekly figures below are equivalents from the
              printed period or insurable weeks.
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Not verified yet
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {analysis.have} of {analysis.required} payslips
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {remaining
                ? `Add ${remaining} more unique slip${remaining === 1 ? "" : "s"} for TruckPay Verified Analysis.`
                : "The three slips are on file but something still blocks verification."}
            </p>
          </>
        )}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-accent"
            style={{ width: `${Math.min(100, (analysis.have / analysis.required) * 100)}%` }}
          />
        </div>
      </div>

      {analysis.blockers.length ? (
        <ul className="space-y-2 rounded-xl border border-destructive/30 bg-card p-4 text-sm">
          {analysis.blockers.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {analysis.warnings.length ? (
        <ul className="space-y-2 rounded-xl border border-accent/40 bg-card p-4 text-sm">
          {analysis.warnings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {profile?.employmentStartDate ? (
        <p className="text-sm text-muted-foreground">
          Tenure: {profile.tenureMonths} months
          {profile.tenureBand ? ` · ${TENURE_BAND_LABELS[profile.tenureBand]}` : ""} ·{" "}
          {TENURE_SOURCE_LABELS[profile.tenureSource ?? "user_declared"]}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add an employment start date on your{" "}
          <Link href="/profile" className="underline">
            profile
          </Link>{" "}
          so tenure can be calculated in months.
        </p>
      )}

      {analysis.latest.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Latest slips (newest first)</h2>
          <ul className="space-y-2">
            {analysis.latest.map((slip) => (
              <li key={slip.id}>
                <Link href={`/payslips/${slip.id}`} className="flex justify-between rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
                  <span>
                    {payslipTitle(slip)} · {FREQUENCY_LABELS[slip.payFrequency]}
                    {slip.payPeriodStart && slip.payPeriodEnd
                      ? ` · ${slip.payPeriodStart} → ${slip.payPeriodEnd}`
                      : " · period missing"}
                  </span>
                  <span className="font-mono">{formatEuroMaybe(slip.grossPay ?? slip.netPay)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {analysis.status === "verified" ? (
        <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl font-semibold">Your weekly-equivalent medians</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Median gross / week equiv.</dt>
              <dd className="font-heading text-2xl">{formatEuroMaybe(analysis.ownMedianWeeklyGross)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Median basic rate</dt>
              <dd className="font-heading text-2xl">{formatEuroMaybe(analysis.ownMedianBaseRate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Median basic hours / week equiv.</dt>
              <dd className="font-heading text-2xl">
                {analysis.ownMedianWeeklyHours != null ? analysis.ownMedianWeeklyHours : "—"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {factors.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Why pay can differ at the same firm</h2>
          <p className="text-sm text-muted-foreground">
            Possible contributors only. Not an accusation, and not because two drivers here do the same job.
          </p>
          {factors.map((factor) => (
            <article key={factor.factor} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <Badge variant={factor.epistemic === "fact" ? "default" : factor.epistemic === "unknown" ? "destructive" : "secondary"}>
                {factor.epistemic}
              </Badge>
              <p className="mt-2 text-sm leading-6">{factor.summary}</p>
            </article>
          ))}
        </section>
      ) : null}

      {companyStats ? (
        <p className="text-xs text-muted-foreground">{companyStats.headline} {companyStats.disclaimer}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/payslips/new" className={cn(buttonVariants(), "bg-accent text-accent-foreground hover:bg-accent/90")}>
          Add a payslip
        </Link>
        <Link href="/profile" className={cn(buttonVariants({ variant: "outline" }))}>
          Employment profile
        </Link>
      </div>
    </div>
  );
}
