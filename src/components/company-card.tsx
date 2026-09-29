"use client";
import { useUiCopy, useT } from "@/components/language-provider";

import Link from "next/link";
import { tenureBandLabel } from "@/lib/payroll/employment-month";
import { formatEuroMaybe } from "@/lib/payroll/format";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { companyStats, equipmentLabels, operationLabels } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompanyCard({ company }: { company: Company }) {
  const tr = useUiCopy();
  const { locale } = useT();
  const { compareSlugs, toggleCompare, reports, payStats } = useAppStore();
  const payroll = payStats[company.slug];
  const salaryBands = payroll?.bands.filter(band => band.published && band.netByFrequency.length > 0) ?? [];
  const selected = compareSlugs.includes(company.slug);
  const stats = companyStats(company.slug, reports);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-start gap-3 px-5 pt-5">
        <CompanyMark company={company} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/companies/${company.slug}`}
            className="font-heading text-xl font-semibold tracking-tight hover:underline"
          >
            {company.name}
          </Link>
          <p className="text-xs text-muted-foreground">{company.headquarters}</p>
          {payroll ? (<p className="mt-1.5 text-xs text-muted-foreground">{salaryBands.length ? (locale === "es" ? "Salarios de nóminas por antigüedad" : "Payslip pay by tenure") : (locale === "es" ? "Estadísticas salariales en pausa" : "Salary statistics paused")}</p>) : stats.count > 0 ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {tr("Saved slips: {n}", { n: stats.count })}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">{locale === "es" ? "Sin estadísticas públicas disponibles" : "No public statistics available"}</p>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4">
        <p className="text-sm leading-6 text-muted-foreground">{company.driverReported ? tr("Company name reported by a driver; company details are not verified.") : company.summary}</p>
        {salaryBands.length > 0 && <div className="space-y-3">
          {salaryBands.map(band => <div key={band.band} className="rounded-lg bg-accent/10 p-3">
            <p className="text-sm font-semibold">{tenureBandLabel(band.band, locale === "es")}</p><p className="text-xs text-muted-foreground">{band.driverCount} {locale === "es" ? (band.driverCount === 1 ? "conductor" : "conductores") : (band.driverCount === 1 ? "driver" : "drivers")} · {band.verifiedPayslipCount} {locale === "es" ? "nóminas" : "payslips"}</p>
            {band.netByFrequency.map(group => <p key={group.frequency} className="mt-1 flex flex-wrap justify-between gap-2 text-sm"><span>{locale === "es" ? "Neto" : "Net"} · {group.frequency === "weekly" ? (locale === "es" ? "semanal" : "weekly") : group.frequency === "fortnightly" ? (locale === "es" ? "cada dos semanas" : "every two weeks") : group.frequency === "monthly" ? (locale === "es" ? "mensual" : "monthly") : group.frequency}</span><strong className="font-mono">{formatEuroMaybe(group.medianNet)}</strong></p>)}
          </div>)}
          <p className="text-xs text-muted-foreground">{locale === "es" ? "Mediana del neto. Antigüedad calculada hasta la fecha de cada nómina a partir del inicio declarado; no representa el sueldo de toda la empresa." : "Median net pay. Tenure uses the declared start and each payslip date; this is not a company-wide salary."}</p>
        </div>}
        {payroll && !salaryBands.length && <p className="text-sm text-muted-foreground">{locale === "es" ? "La empresa está en el directorio. Las estadísticas salariales están en pausa mientras revisamos las protecciones de privacidad." : "The company is listed. Salary statistics are paused while we review privacy protections."}</p>}
        {!payroll && stats.count > 0 && <PayGapBar stats={stats} />}
        <div className="flex flex-wrap gap-1 border-t border-dashed border-border pt-3">
          {company.equipment.map((item) => (
            <Badge key={item} variant="outline">
              {tr(equipmentLabels[item])}
            </Badge>
          ))}
          {company.operations.map((item) => (
            <Badge key={item} variant="secondary">
              {tr(operationLabels[item])}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-2 border-t border-border bg-muted/40 px-5 py-3">
        <Link href={`/companies/${company.slug}`} className={cn(buttonVariants({ size: "sm" }), "flex-1")}>{tr("Open file")}</Link>
        <Button size="sm" variant={selected ? "secondary" : "outline"} onClick={() => toggleCompare(company.slug)}>
          {selected ? tr("In compare") : tr("Compare")}
        </Button>
      </div>
    </article>
  );
}
