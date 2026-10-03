"use client";
import { UnlockedNextSteps } from "./unlocked-next-steps";
import { netFrequencyLabel } from "./company-pay-stats";
import { tenureBandLabel } from "@/lib/payroll/employment-month";

import { EmploymentStartField } from "./employment-start-field";
import { consecutiveOnboarding } from "@/lib/payroll/onboarding";
import { PayslipGapNotice } from "./payslip-gap-notice";

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
import { formatPayrollMoneyMaybe } from "@/lib/payroll/format";
import { useMarket } from "./market-provider";
import {
  ANOMALY_STATUS_LABELS,
  EVIDENCE_LEVEL_LABELS,
  PAY_CONFIDENCE_LABELS,

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

export function AnalysisBoard({ compact = false, employer }: { compact?: boolean; employer?: string }) {
  const market = useMarket();
  const formatEuroMaybe = (value: number | null | undefined) => formatPayrollMoneyMaybe(value, market === "US" ? "USD" : "EUR");
  const tr = useUiCopy();
  const { t, locale } = useT();
  const [data, setData] = useState<Payload | { employmentRequired: { employerName: string; asOf: string } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => fetch(employer ? `/api/analysis?employer=${encodeURIComponent(employer)}` : "/api/analysis", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(value => { setError(null); setData(value); })
      .catch(() => setError("Analysis could not be loaded."));
    load();
    window.addEventListener("truckpay-employment-changed", load);
    window.addEventListener("truckpay-payslips-changed", load);
    return () => { window.removeEventListener("truckpay-employment-changed", load); window.removeEventListener("truckpay-payslips-changed", load); };
  }, [employer]);

  if (error) return <p className="text-sm text-destructive">{tr(error)}</p>;
  if (!data) return <p className="text-sm text-muted-foreground">{tr("Reading your latest slips…")}</p>;

  if ("employmentRequired" in data && compact) return null;
  if ("employmentRequired" in data) return <EmploymentStartField {...data.employmentRequired} />;

  const { analysis, profile, companyStats, factors, payChange } = data;
  const anomalies = analysis.anomalies.filter(item => item.status === "confirmed" || item.status === "possible_anomaly");
  const visibleFactors = factors.filter(item => item.factor === "net" && item.epistemic !== "unknown" && item.yours != null && item.peerMedian != null);
  const changeLines = payChange?.lines.filter(item => item.kind === "net_delta" && item.epistemic !== "unknown") ?? [];
  const { gaps } = consecutiveOnboarding(analysis.latest);
  const remaining = Math.max(0, analysis.required - analysis.have);

  if (compact) return <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="border-b border-border bg-primary px-5 py-5 text-primary-foreground sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{locale === "es" ? "Tu resumen" : "Your summary"}</p>
      <h2 className="mt-2 font-heading text-3xl font-semibold">{analysis.latest[0]?.employerName ?? (locale === "es" ? "Tus nóminas, de un vistazo" : "Your payslips at a glance")}</h2>
      <p className="mt-2 text-sm text-primary-foreground/80">{locale === "es" ? "Resumen de las nóminas comparables de esta empresa." : "Summary of comparable payslips from this employer."}</p>
    </div>
    <div className="space-y-5 p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {analysis.ownNetByFrequency.map(group => <div key={group.frequency} className="rounded-xl bg-accent/15 p-4">
          <p className="text-sm font-medium">{locale === "es" ? "Neto habitual · mediana" : "Typical net pay · median"}</p>
          <p className="mt-2 font-heading text-4xl font-semibold tabular-nums">{formatEuroMaybe(group.medianNet)}</p>
          <p className="mt-2 text-xs text-muted-foreground">{netFrequencyLabel(group.frequency, locale === "es")} · {group.payslipCount} {locale === "es" ? "nóminas" : "payslips"}</p>
        </div>)}
        <div className="rounded-xl border border-border p-4"><p className="text-sm font-medium">{locale === "es" ? "Pendiente de revisión" : "Needs review"}</p><p className="mt-2 font-heading text-4xl font-semibold">{anomalies.length + analysis.blockers.length}</p><p className="mt-2 text-xs text-muted-foreground">{locale === "es" ? "Avisos detectados; no confirman por sí solos un error salarial." : "Detected notices do not by themselves confirm a pay error."}</p></div>
      </div>
      {changeLines.length > 0 && <div><h3 className="font-semibold">{locale === "es" ? "Qué ha cambiado" : "What changed"}</h3>{changeLines.map((line, i) => <p key={i} className="mt-2 text-sm leading-6">{tr(line.summary)}</p>)}</div>}
      {(anomalies.length > 0 || analysis.blockers.length > 0) && <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium">{locale === "es" ? "Ver los avisos" : "View notices"}</summary><ul className="mt-3 space-y-3 text-sm">{analysis.blockers.map(item => <li key={item}>{tr(item)}</li>)}{anomalies.map(item => <li key={item.id}><strong>{tr(ANOMALY_STATUS_LABELS[item.status])}: </strong>{tr(item.summary)}</li>)}</ul></details>}
    </div>
  </div>;

  return (
    <div className="space-y-8">
      {analysis.verifiedLabel && <UnlockedNextSteps />}
      <div className="stub-paper rounded-xl p-5 ring-1 ring-foreground/10">
        {analysis.verifiedLabel ? (
          <>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-pay-up uppercase">
              {locale === "es" ? "Análisis de tus nóminas" : "Your payslip analysis"}
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">{locale === "es" ? "Tres períodos consecutivos completados" : "Three consecutive periods completed"}</p>

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

      {analysis.sequence.consecutiveEpistemic === "inference" && <p className="text-xs text-muted-foreground">{locale === "es" ? "Continuidad estimada por fechas de pago" : "Continuity estimated from payment dates"}</p>}

      {analysis.blockers.length ? (
        <ul className="space-y-2 rounded-xl border border-destructive/30 bg-card p-4 text-sm">
          {analysis.blockers.map((item) => (
            <li key={item}>{tr(item)}</li>
          ))}
        </ul>
      ) : null}



      {anomalies.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("Anomaly watch")}</h2>
          <p className="text-sm text-muted-foreground">{tr("Confirmed only with enough evidence. Possible anomaly, needs review, and insufficient data are not treated as proof of an error.")}</p>
          <ul className="space-y-2">
            {anomalies.map((item) => (
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

      {profile?.employmentStartMonth ? (
        <p className="text-sm text-muted-foreground">
          {locale === "es" ? `Antigüedad a fecha de nómina: ${profile.tenureMonths} meses` : `Tenure at payslip date: ${profile.tenureMonths} months`}
          {profile.tenureBand ? ` · ${tenureBandLabel(profile.tenureBand, locale === "es")}` : ""} ·{" "}
          {tr(TENURE_SOURCE_LABELS[profile.tenureSource ?? "user_declared"])}
        </p>
      ) : null}

      {analysis.latest.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("Latest slips (newest first)")}</h2>
          <ul className="space-y-2">
            {analysis.latest.map((slip) => (
              <li key={slip.id}>
                <Link href={`/payslips/${slip.id}`} className="flex justify-between rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
                  <span>
                    {gaps[slip.id] && <PayslipGapNotice frequency={gaps[slip.id]} />}
                    {t("detail.paid", { date: slip.paymentDate })} · {t(frequencyMessageKey(slip.payFrequency))}
                    {slip.weekAssignment?.weekNumber != null
                      ? ` · ${t("payslips.week", { n: slip.weekAssignment.weekNumber })}${slip.weekAssignment.derived ? ` ${t("payslips.derived")}` : ""}`
                      : ""}
                    {slip.payPeriodStart && slip.payPeriodEnd
                      ? ` · ${slip.payPeriodStart} → ${slip.payPeriodEnd}`
                      : ""}
                  </span>
                  <span className="font-mono">{formatEuroMaybe(slip.netPay)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {changeLines.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("This slip versus your recent slips")}</h2>
          <p className="text-sm text-muted-foreground">{tr("Weekly equivalents use printed insurable weeks or the pay period. One slip is not assumed to be one working week. Unexplained remainder stays unexplained.")}</p>
          {changeLines.map((line) => (
            <article key={`${line.kind}-${tr(line.summary)}`} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <Badge variant={line.epistemic === "fact" ? "default" : line.epistemic === "unknown" ? "destructive" : "secondary"}>
                {tr(line.epistemic)}
              </Badge>
              <p className="mt-2 text-sm leading-6">{line.summary}</p>
            </article>
          ))}
        </section>
      ) : null}

      {analysis.status === "verified" && <section className="rounded-xl bg-accent p-5 text-accent-foreground">
        <h2 className="font-heading text-xl font-semibold">{locale === "es" ? "Tu salario neto" : "Your net pay"}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {analysis.ownNetByFrequency.map(group => <div key={group.frequency}><dt className="text-sm text-accent-foreground">{netFrequencyLabel(group.frequency, locale === "es")}</dt><dd className="mt-1 font-heading text-3xl font-semibold text-accent-foreground">{formatEuroMaybe(group.medianNet)}</dd><p className="text-xs text-accent-foreground">{group.payslipCount} {locale === "es" ? "nóminas con neto disponible" : "payslips with net pay"}</p></div>)}
        </dl>
        {!analysis.ownNetByFrequency.length && <p>{locale === "es" ? "Neto no disponible" : "Net pay unavailable"}</p>}
      </section>}

      {visibleFactors.length ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">{tr("Why pay can differ at the same firm")}</h2>
          <p className="text-sm text-muted-foreground">{tr("Possible contributors only. Not an accusation, and not because two drivers here do the same job.")}</p>
          {visibleFactors.map((factor) => (
            <article key={factor.factor} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <Badge variant={factor.epistemic === "fact" ? "default" : factor.epistemic === "unknown" ? "destructive" : "secondary"}>
                {tr(factor.epistemic)}
              </Badge>
              <p className="mt-2 text-sm leading-6">{tr(factor.summary)}</p>
            </article>
          ))}
        </section>
      ) : null}

      {companyStats?.bands.some(band => band.published) ? (
        <p className="text-xs text-muted-foreground">
          {tr(EVIDENCE_LEVEL_LABELS[companyStats.evidenceLevel])} · {tr("Confidence")}{" "}
          {tr(PAY_CONFIDENCE_LABELS[companyStats.confidence])}. {tr("Sample: {drivers} drivers; {slips} payslips.", { drivers: companyStats.driverCount, slips: companyStats.verifiedPayslipCount })} {tr(companyStats.disclaimer)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/payslips/new" className={cn(buttonVariants(), "bg-accent text-accent-foreground hover:bg-accent/90")}>{tr("Add a payslip")}</Link>
        <Link href="/profile" className={cn(buttonVariants({ variant: "outline" }))}>{tr("Employment profile")}</Link>
      </div>
    </div>
  );
}
