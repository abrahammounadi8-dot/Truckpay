"use client";
import { useEffect, useState } from "react";
import { tenureBandLabel } from "@/lib/payroll/employment-month";

import { useUiCopy, useT } from "@/components/language-provider";

import { Badge } from "@/components/ui/badge";
import { formatPayrollMoneyMaybe } from "@/lib/payroll/format";
import { useMarket } from "./market-provider";
import type { CompanyPayStats } from "@/lib/payroll/company-stats";

import {
  EVIDENCE_LEVEL_LABELS,
  JOB_TYPE_LABELS,
  PAY_CONFIDENCE_LABELS,
  SHIFT_TYPE_LABELS,

  TIME_FRACTION_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/lib/payroll/types";

export function CompanyPayStatsPanel({ stats: initialStats }: { stats: CompanyPayStats }) {
  const market = useMarket();
  const formatEuroMaybe = (value: number | null | undefined) => formatPayrollMoneyMaybe(value, market === "GB" ? "GBP" : "EUR");
  const [freshStats, setFreshStats] = useState<CompanyPayStats | null>(null);
  const stats = freshStats?.employerSlug === initialStats.employerSlug ? freshStats : initialStats;
  useEffect(() => {
    let cancelled = false;
    const load = () => fetch(`/api/companies/${encodeURIComponent(initialStats.employerSlug)}/stats`, { cache: "no-store" }).then(async response => { if (!response.ok) throw Error(); return response.json(); }).then(data => { if (!cancelled) setFreshStats(data.stats); }).catch(() => {});
    load();
    window.addEventListener("focus", load);
    window.addEventListener("truckpay-employment-changed", load);
    window.addEventListener("truckpay-payslips-changed", load);
    return () => { cancelled = true; window.removeEventListener("focus", load); window.removeEventListener("truckpay-employment-changed", load); window.removeEventListener("truckpay-payslips-changed", load); };
  }, [initialStats.employerSlug]);
  const tr = useUiCopy();
  const { locale } = useT();
  const sampleLabel = (drivers: number, slips: number) => locale === "es" ? `${drivers} ${drivers === 1 ? "conductor" : "conductores"} · ${slips} ${slips === 1 ? "nómina" : "nóminas"}` : `${drivers} ${drivers === 1 ? "driver" : "drivers"} · ${slips} payslips`;
  const publishedSlices = stats.slices.filter((slice) => slice.published);
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-heading text-xl font-semibold">{locale === "es" ? "Salarios por antigüedad" : "Pay by tenure"}</h2>
        <Badge>{tr(EVIDENCE_LEVEL_LABELS[stats.evidenceLevel])}</Badge>
        <Badge variant="secondary">{tr("Confidence")}{" "}{tr(PAY_CONFIDENCE_LABELS[stats.confidence])}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{stats.driverCount > 0 ? sampleLabel(stats.driverCount, stats.verifiedPayslipCount) : (locale === "es" ? "Todavía no hay aportaciones válidas" : "No qualifying contributions yet")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{locale === "es" ? "Medianas de las aportaciones autorizadas, disponibles desde un conductor. Una muestra pequeña no representa el salario habitual de la empresa." : tr(stats.disclaimer)}</p>
      <p className="mt-2 text-xs text-muted-foreground">{locale === "es" ? "Antigüedad declarada, calculada a fecha de cada nómina. Se indica cuántos conductores aportan datos en cada tramo." : "Self-declared tenure, calculated at each payslip date. Each band shows how many drivers contributed."}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {stats.bands.map((band) => (
          <article key={band.band} className="rounded-lg border border-border p-4">
            <p className="font-heading text-lg font-semibold">{tenureBandLabel(band.band, locale === "es")}</p>
            <p className="text-xs text-muted-foreground">
              {tr(EVIDENCE_LEVEL_LABELS[band.evidenceLevel])} · {tr(PAY_CONFIDENCE_LABELS[band.confidence])}
            </p>
            {band.driverCount === 1 && <p className="mt-2 text-sm font-semibold">{locale === "es" ? "Aportación de un conductor" : "Contribution from one driver"}</p>}
            {band.published ? (
              <dl className="mt-3 space-y-1 text-sm">
                {!band.netByFrequency.length && <p>{locale === "es" ? "Neto no disponible" : "Net pay unavailable"}</p>}
                {band.netByFrequency.map(group => <div key={group.frequency} className="flex justify-between gap-3 rounded-lg bg-accent p-3 text-accent-foreground">
                  <dt>{netFrequencyLabel(group.frequency, locale === "es")}</dt>
                  <dd className="font-mono text-xl font-semibold text-accent-foreground">{formatEuroMaybe(group.medianNet)}</dd>
                </div>)}
                {band.medianPaidHoursWeekly != null && <div className="flex justify-between gap-3">
                  <dt>{tr("Median paid hours / week equiv.")}</dt>
                  <dd className="font-mono">
                    {band.medianPaidHoursWeekly != null ? band.medianPaidHoursWeekly : "—"}
                  </dd>
                </div>}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{locale === "es" ? "Todavía no hay aportaciones válidas en este tramo" : "No qualifying contributions in this band yet"}</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{band.published ? sampleLabel(band.driverCount, band.verifiedPayslipCount) : ""}{" "}{band.published ? tr("Small samples are not statistically representative. Medians do not establish a company-wide salary.") : ""}</p>
          </article>
        ))}
      </div>
      {publishedSlices.length ? (
        <div className="mt-6 space-y-3">
          <h3 className="font-heading text-lg font-semibold">{tr("By job, vehicle and shift")}</h3>
          <p className="text-sm text-muted-foreground">{locale === "es" ? "Aportaciones disponibles por contexto, con su número de conductores." : "Available contributions by context, with driver counts."}</p>
          {publishedSlices.map((slice) => (
            <article
              key={`${slice.jobType}-${slice.vehicleType}-${slice.shiftType}-${slice.timeFraction}-${slice.tenureBand}`}
              className="rounded-lg border border-border p-4 text-sm"
            >
              <p className="font-medium">
                {tr(VEHICLE_TYPE_LABELS[slice.vehicleType])} · {tr(SHIFT_TYPE_LABELS[slice.shiftType])} ·{" "}
                {tenureBandLabel(slice.tenureBand, locale === "es")}
              </p>
              <p className="text-xs text-muted-foreground">
                {tr(JOB_TYPE_LABELS[slice.jobType])} · {tr(TIME_FRACTION_LABELS[slice.timeFraction])} ·{" "}
                {tr(EVIDENCE_LEVEL_LABELS[slice.evidenceLevel])} · {tr(PAY_CONFIDENCE_LABELS[slice.confidence])}
              </p>
              <dl className="mt-2 space-y-1">
                {slice.netByFrequency.map(group => <div key={group.frequency} className="flex justify-between gap-3 rounded-lg bg-accent p-3 text-accent-foreground"><dt>{netFrequencyLabel(group.frequency, locale === "es")}</dt><dd className="font-mono">{formatEuroMaybe(group.medianNet)}</dd></div>)}
                {!slice.netByFrequency.length && <p>{locale === "es" ? "Neto no disponible" : "Net pay unavailable"}</p>}
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">{sampleLabel(slice.driverCount, slice.verifiedPayslipCount)}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function netFrequencyLabel(frequency: string, spanish: boolean) {
 const labels: Record<string, [string,string]> = {
 weekly: ["Neto semanal · mediana", "Median net per weekly payslip"],
 fortnightly: ["Neto por dos semanas · mediana", "Median net per fortnightly payslip"],
 monthly: ["Neto mensual · mediana", "Median net per monthly payslip"],
 lunar: ["Neto por cuatro semanas · mediana", "Median net per four-week payslip"],
 };
 return labels[frequency]?.[spanish ? 0 : 1] ?? (spanish ? "Mediana neta por nómina (frecuencia desconocida)" : "Median net per payslip (unknown frequency)");
}
