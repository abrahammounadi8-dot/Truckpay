"use client";
import { useUiCopy, useT } from "@/components/language-provider";

import Link from "next/link";
import { CompanyAddress } from "./company-address";
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
    <article className={cn("flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-md ring-1 transition-shadow hover:shadow-lg", selected ? "ring-2 ring-accent" : "ring-foreground/10")}>
      <div className="flex items-start gap-3 border-b-4 border-accent bg-primary px-5 py-5 text-primary-foreground">
        <CompanyMark company={company} size="lg" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/companies/${company.slug}`}
            className="font-heading text-2xl font-semibold tracking-tight text-primary-foreground hover:text-accent hover:underline"
          >
            {company.name}
          </Link>
          <p className="mt-1 text-xs text-primary-foreground/80">{company.headquarters}</p>
          {payroll ? (<p className="mt-2 text-xs font-medium text-accent">{salaryBands.length ? (locale === "es" ? "Salarios de nóminas por antigüedad" : "Payslip pay by tenure") : (locale === "es" ? "Sin aportaciones autorizadas" : "No authorised contributions")}</p>) : stats.count > 0 ? (
            <p className="mt-2 text-xs font-medium text-accent">
              {tr("Saved slips: {n}", { n: stats.count })}
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-accent">{locale === "es" ? "Sin estadísticas públicas disponibles" : "No public statistics available"}</p>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4">
        <CompanyAddress company={company} />
        <p className="text-sm leading-6 text-muted-foreground">{company.driverReported ? tr("Company name reported by a driver; company details are not verified.") : company.summary}</p>
        {salaryBands.length > 0 && <div className="space-y-3">
          {salaryBands.map(band => <div key={band.band} className="rounded-xl border border-accent bg-accent p-4 text-accent-foreground">
            <p className="text-sm font-semibold">{tenureBandLabel(band.band, locale === "es")}</p><p className="mt-1 text-xs text-accent-foreground/80">{band.driverCount} {locale === "es" ? (band.driverCount === 1 ? "conductor" : "conductores") : (band.driverCount === 1 ? "driver" : "drivers")} · {band.verifiedPayslipCount} {locale === "es" ? "nóminas" : "payslips"}</p>
            {band.netByFrequency.map(group => <p key={group.frequency} className="mt-1 flex flex-wrap justify-between gap-2 text-sm"><span>{locale === "es" ? "Neto" : "Net"} · {group.frequency === "weekly" ? (locale === "es" ? "semanal" : "weekly") : group.frequency === "fortnightly" ? (locale === "es" ? "cada dos semanas" : "every two weeks") : group.frequency === "monthly" ? (locale === "es" ? "mensual" : "monthly") : group.frequency}</span><strong className="font-heading text-3xl tabular-nums">{formatEuroMaybe(group.medianNet)}</strong></p>)}
          </div>)}
          <p className="text-xs text-muted-foreground">{locale === "es" ? "Mediana del neto. Antigüedad calculada hasta la fecha de cada nómina a partir del inicio declarado; no representa el sueldo de toda la empresa." : "Median net pay. Tenure uses the declared start and each payslip date; this is not a company-wide salary."}</p>
        </div>}
        {payroll && !salaryBands.length && <p className="text-sm text-muted-foreground">{locale === "es" ? "La empresa está en el directorio. Las cifras estarán disponibles desde la primera aportación válida y autorizada." : "The company is listed. Figures are available from the first qualifying, authorised contribution."}</p>}
        {!payroll && stats.count > 0 && <PayGapBar stats={stats} />}
        <div className="flex flex-wrap gap-1 border-t border-dashed border-border pt-3">
          {company.equipment.map((item) => (
            <Badge key={item} variant="outline" className="border-primary/20 bg-primary/10 text-primary">
              {tr(equipmentLabels[item])}
            </Badge>
          ))}
          {company.operations.map((item) => (
            <Badge key={item} variant="secondary" className="bg-accent/25 text-accent-foreground">
              {tr(operationLabels[item])}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-accent/30 bg-accent/10 px-5 py-4">
        <Link href={`/companies/${company.slug}`} className={cn(buttonVariants({ size: "sm" }), "min-h-11 flex-1")}>{tr("Open file")}</Link>
        <Button size="sm" variant={selected ? "secondary" : "outline"} aria-pressed={selected} className={cn("min-h-11 border-accent bg-accent text-accent-foreground hover:bg-accent/80", selected && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")} onClick={() => toggleCompare(company.slug)}>
          {selected ? tr("In compare") : tr("Compare")}
        </Button>
      </div>
    </article>
  );
}
