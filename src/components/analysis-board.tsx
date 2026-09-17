"use client";
import { useUiCopy } from "@/components/language-provider";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import type { SetAnalysis } from "@/lib/payroll/analysis";
import type { PayChangeReport } from "@/lib/payroll/change";
import type { CompanyPayStats } from "@/lib/payroll/company-stats";
import type { PayFactor } from "@/lib/payroll/explain";
import { frequencyMessageKey } from "@/lib/i18n";
import { formatEuroMaybe } from "@/lib/payroll/format";
import {
  ANOMALY_STATUS_LABELS,
  EVIDENCE_LEVEL_LABELS,
  PAY_CONFIDENCE_LABELS,
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
  payChange: PayChangeReport | null;
};

export function AnalysisBoard() {
  const tr = useUiCopy();
  const { t } = useT();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analysis", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Analysis could not be loaded."));
  }, []);

  if (error) return <p className="text-sm text-destructive">{tr(error)}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">{tr("Reading your latest slips…")}</p>;

  const { analysis, profile, companyStats, factors, payChange } = data;
  const remaining = Math.max(0, analysis.required - analysis.have);

  return (
    <div className="space-y-8">
      <div className="stub-paper rounded-xl p-5 ring-1 ring-foreground/10">
        {analysis.verifiedLabel ? (
          <>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-pay-up uppercase">
              {tr("Payroll verified")}
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{tr("Latest {n} slips checked", { n: REQUIRED_PAYSLIPS })}</p>
            <p className="mt-2 text-sm text-muted-foreground">{tr("One payslip is not treated as one working week. Weekly figures below are equivalents from the printed period or insurable weeks.")}</p>
          </>
        ) : (
          <>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">{tr("Not verified yet")}</p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {tr("{have} of {required} payslips", { have: analysis.have, required: analysis.required })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {remaining
                ? tr("Add {n} more unique payslips to complete the analysis.", { n: remaining })
                : tr("The three slips are on file but something still blocks verification.")}
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
            <li key={item}>{tr(item)}</li>
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

      {analysis.anomalies?.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("Anomaly watch")}</h2>
          <p className="text-sm text-muted-foreground">{tr("Confirmed only with enough evidence. Possible anomaly, needs review, and insufficient data are not treated as proof of an error.")}</p>
          <ul className="space-y-2">
            {analysis.anomalies.map((item) => (
              <li key={item.id} className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
                <Badge variant={item.status === "confirmed" ? "default" : item.status === "insufficient_data" ? "secondary" : "destructive"}>
                  {tr(ANOMALY_STATUS_LABELS[item.status])}
                </Badge>
                <p className="mt-2 leading-6">{tr(item.summary)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {profile?.employmentStartDate ? (
        <p className="text-sm text-muted-foreground">
          {tr("Tenure: {n} months", { n: profile.tenureMonths ?? 0 })}
          {profile.tenureBand ? ` · ${tr(TENURE_BAND_LABELS[profile.tenureBand])}` : ""} ·{" "}
          {tr(TENURE_SOURCE_LABELS[profile.tenureSource ?? "user_declared"])}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/profile" className="underline">{tr("Add your employment start date in your profile to calculate tenure.")}</Link>
        </p>
      )}

      {analysis.latest.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("Latest slips (newest first)")}</h2>
          <ul className="space-y-2">
            {analysis.latest.map((slip) => (
              <li key={slip.id}>
                <Link href={`/payslips/${slip.id}`} className="flex justify-between rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
                  <span>
                    {t("detail.paid", { date: slip.paymentDate })} · {t(frequencyMessageKey(slip.payFrequency))}
                    {slip.weekAssignment?.weekNumber != null
                      ? ` · ${t("payslips.week", { n: slip.weekAssignment.weekNumber })}${slip.weekAssignment.derived ? ` ${t("payslips.derived")}` : ""}`
                      : ` · ${t("payslips.weekNotAssigned")}`}
                    {slip.payPeriodStart && slip.payPeriodEnd
                      ? ` · ${slip.payPeriodStart} → ${slip.payPeriodEnd}`
                      : " · " + tr("Period missing")}
                  </span>
                  <span className="font-mono">{formatEuroMaybe(slip.grossPay ?? slip.netPay)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {payChange?.lines.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("This slip versus your recent slips")}</h2>
          <p className="text-sm text-muted-foreground">{tr("Weekly equivalents use printed insurable weeks or the pay period. One slip is not assumed to be one working week. Unexplained remainder stays unexplained.")}</p>
          {payChange.lines.map((line) => (
            <article key={`${line.kind}-${tr(line.summary)}`} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <Badge variant={line.epistemic === "fact" ? "default" : line.epistemic === "unknown" ? "destructive" : "secondary"}>
                {tr(line.epistemic)}
              </Badge>
              <p className="mt-2 text-sm leading-6">{line.summary}</p>
            </article>
          ))}
        </section>
      ) : null}

      {analysis.status === "verified" ? (
        <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl font-semibold">{tr("Your weekly-equivalent medians")}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">{tr("Median gross / week equiv.")}</dt>
              <dd className="font-heading text-2xl">{formatEuroMaybe(analysis.ownMedianWeeklyGross)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{tr("Median basic rate")}</dt>
              <dd className="font-heading text-2xl">{formatEuroMaybe(analysis.ownMedianBaseRate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{tr("Median basic hours / week equiv.")}</dt>
              <dd className="font-heading text-2xl">
                {analysis.ownMedianWeeklyHours != null ? analysis.ownMedianWeeklyHours : "—"}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {factors.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("Why pay can differ at the same firm")}</h2>
          <p className="text-sm text-muted-foreground">{tr("Possible contributors only. Not an accusation, and not because two drivers here do the same job.")}</p>
          {factors.map((factor) => (
            <article key={factor.factor} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <Badge variant={factor.epistemic === "fact" ? "default" : factor.epistemic === "unknown" ? "destructive" : "secondary"}>
                {tr(factor.epistemic)}
              </Badge>
              <p className="mt-2 text-sm leading-6">{tr(factor.summary)}</p>
            </article>
          ))}
        </section>
      ) : null}

      {companyStats ? (
        <p className="text-xs text-muted-foreground">
          {tr(EVIDENCE_LEVEL_LABELS[companyStats.evidenceLevel])} · {tr("Confidence")}{" "}
          {tr(PAY_CONFIDENCE_LABELS[companyStats.confidence])}. {tr("Sample: {drivers} drivers; {slips} payslips.", { drivers: companyStats.bands.reduce((n, b) => n + b.driverCount, 0), slips: companyStats.bands.reduce((n, b) => n + b.verifiedPayslipCount, 0) })} {tr(companyStats.disclaimer)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/payslips/new" className={cn(buttonVariants(), "bg-accent text-accent-foreground hover:bg-accent/90")}>{tr("Add a payslip")}</Link>
        <Link href="/profile" className={cn(buttonVariants({ variant: "outline" }))}>{tr("Employment profile")}</Link>
      </div>
    </div>
  );
}
