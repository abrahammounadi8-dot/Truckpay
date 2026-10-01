"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ArrowLeftRight, MapPin, Users, FileText, X } from "lucide-react";
import { useUiCopy, useT } from "@/components/language-provider";
import { CompanyMark } from "@/components/company-mark";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { equipmentLabels, operationLabels } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { formatEuroMaybe } from "@/lib/payroll/format";
import { tenureBandLabel } from "@/lib/payroll/employment-month";
import { netFrequencyLabel } from "@/components/company-pay-stats";
import type { TenureBand } from "@/lib/payroll/types";

const bands: TenureBand[] = ["0_1", "1_3", "3_5", "5_plus"];

export function CompareTable({ ids }: { ids: string[] }) {
  const tr = useUiCopy();
  const { locale } = useT();
  const es = locale === "es";
  const router = useRouter();
  const { companies, compareSlugs, toggleCompare, payStats, ready } = useAppStore();
  const [band, setBand] = useState<TenureBand>("0_1");
  const [frequency, setFrequency] = useState("weekly");
  const querySlugs = [...new Set(ids.filter(id => companies.some(company => company.slug === id)))];
  const slugs = (ids.length ? querySlugs : compareSlugs).slice(0, 3);
  const selected = slugs.flatMap(slug => {
    const company = companies.find(item => item.slug === slug);
    return company ? [company] : [];
  });
  const missing = es ? "Todavía sin datos" : "No data yet";
  const records = selected.map(company => {
    const salaryBand = payStats[company.slug]?.bands.find(item => item.band === band && item.published);
    const net = salaryBand?.netByFrequency.find(item => item.frequency === frequency);
    return { company, salaryBand, net };
  });
  function remove(slug: string) {
    if (compareSlugs.includes(slug)) toggleCompare(slug);
    router.replace(`/compare?ids=${slugs.filter(item => item !== slug).join(",")}`);
  }

  if (!ready) return <p role="status" className="rounded-2xl bg-card p-8 text-center text-muted-foreground">{es ? "Preparando la comparación…" : "Preparing your comparison…"}</p>;
  if (!selected.length) return <div className="rounded-2xl border border-dashed border-accent bg-card px-6 py-14 text-center">
    <ArrowLeftRight className="mx-auto mb-5 size-14 rounded-2xl bg-accent/20 p-3" aria-hidden="true" />
    <h2 className="font-heading text-2xl font-semibold">{es ? "Tu próxima empresa empieza aquí" : "Your next employer starts here"}</h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{es ? "Elige hasta tres empresas del directorio y compara sus datos lado a lado." : "Choose up to three employers from the directory and compare their details side by side."}</p>
    <Link href="/companies" className={cn(buttonVariants(), "mt-6 min-h-12 bg-accent text-accent-foreground hover:bg-accent/90")}>{tr("Browse hauliers")}<ArrowRight aria-hidden="true" /></Link>
  </div>;

  return <div className="space-y-6 pb-24">
    <section className="rounded-2xl bg-primary p-5 text-primary-foreground sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{es ? "Tu decisión, con datos" : "Your decision, with data"}</p><h2 className="mt-2 font-heading text-2xl font-semibold">{es ? "Compara en las mismas condiciones" : "Compare on equal terms"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/80">{es ? "Selecciona la misma antigüedad y frecuencia de pago para todas las empresas." : "Select the same tenure and pay frequency for every employer."}</p></div>
        <Link href="/companies" className={cn(buttonVariants({variant:"secondary"}), "min-h-11")}>{es ? "Elegir empresas" : "Choose employers"}<ArrowRight aria-hidden="true" /></Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium"><span className="block">{es ? "Antigüedad en la empresa" : "Time at the employer"}</span><select value={band} onChange={event => setBand(event.target.value as TenureBand)} className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground">{bands.map(value => <option key={value} value={value}>{tenureBandLabel(value, es)}</option>)}</select></label>
        <label className="space-y-2 text-sm font-medium"><span className="block">{es ? "Frecuencia de la nómina" : "Payslip frequency"}</span><select value={frequency} onChange={event => setFrequency(event.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-foreground">{["weekly", "fortnightly", "monthly"].map(value => <option key={value} value={value}>{netFrequencyLabel(value, es)}</option>)}</select></label>
      </div>
    </section>

    <div className={cn("grid gap-4", selected.length === 2 ? "md:grid-cols-2" : selected.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {records.map(({ company, net }) => <article key={company.slug} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-start gap-3 p-5"><CompanyMark company={company} size="lg" /><div className="min-w-0 flex-1"><Link href={`/companies/${company.slug}`} className="font-heading text-xl font-semibold hover:underline">{company.name}</Link><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 shrink-0" aria-hidden="true" />{company.headquarters}</p></div><button type="button" onClick={() => remove(company.slug)} aria-label={`${tr("Remove")} ${company.name}`} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><X className="size-4" aria-hidden="true" /></button></div>
        <div className="mx-5 rounded-xl bg-accent/15 p-5"><p className="text-xs font-semibold uppercase tracking-wide">{es ? "Salario neto · mediana" : "Net pay · median"}</p><p className={cn("mt-3 font-heading font-semibold tabular-nums", net ? "text-4xl" : "text-xl text-muted-foreground")}>{net ? formatEuroMaybe(net.medianNet) : missing}</p><p className="mt-2 text-sm text-muted-foreground">{netFrequencyLabel(frequency, es)} · {tenureBandLabel(band, es)}</p></div>
        <div className="flex-1 p-5"><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Users className="size-4" aria-hidden="true" />{net?.driverCount ?? 0} {es ? "conductores" : "drivers"}</span><span className="inline-flex items-center gap-1.5"><FileText className="size-4" aria-hidden="true" />{net?.payslipCount ?? 0} {es ? "nóminas" : "payslips"}</span></div><div className="mt-4 flex flex-wrap gap-1.5">{company.equipment.map(item => <Badge key={item} variant="outline">{tr(equipmentLabels[item])}</Badge>)}</div></div>
        <Link href={`/companies/${company.slug}`} className="flex min-h-12 items-center justify-between border-t border-border bg-muted/40 px-5 py-3 text-sm font-semibold hover:bg-muted">{es ? "Ver empresa y datos" : "View employer and data"}<ArrowRight className="size-4" aria-hidden="true" /></Link>
      </article>)}
      {selected.length === 1 && <Link href="/companies" className="flex min-h-60 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center hover:border-accent hover:bg-accent/5"><ArrowLeftRight className="mb-4 size-10 text-muted-foreground" aria-hidden="true" /><span className="font-heading text-xl font-semibold">{es ? "Añade otra empresa" : "Add another employer"}</span><span className="mt-2 text-sm text-muted-foreground">{es ? "Elige con quién quieres comparar" : "Choose who to compare with"}</span></Link>}
    </div>

    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4"><h2 className="font-heading text-xl font-semibold">{es ? "Los detalles, lado a lado" : "The details, side by side"}</h2><p className="mt-1 text-xs text-muted-foreground">{es ? "En móvil, desliza la tabla para ver todas las empresas." : "On mobile, scroll the table to see every employer."}</p></div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={es ? "Tabla de comparación de empresas" : "Employer comparison table"}>
        <table className="w-full min-w-[600px] text-sm"><caption className="sr-only">{es ? "Comparación de empresas con igual antigüedad y frecuencia de pago" : "Employer comparison with matching tenure and pay frequency"}</caption><thead><tr className="bg-primary text-primary-foreground"><th scope="col" className="px-5 py-4 text-left">{es ? "Qué comparamos" : "What we compare"}</th>{selected.map(company => <th scope="col" key={company.slug} className="px-5 py-4 text-left font-heading">{company.shortName}</th>)}</tr></thead><tbody>
          {[
            {label: es ? "Neto · mediana" : "Net pay · median", values: records.map(({net}) => net ? formatEuroMaybe(net.medianNet) : missing)},
            {label: es ? "Conductores que aportan datos" : "Contributing drivers", values: records.map(({net}) => net?.driverCount ?? missing)},
            {label: es ? "Nóminas de esta muestra" : "Payslips in this sample", values: records.map(({net}) => net?.payslipCount ?? missing)},
            {label: tr("Headquarters"), values: selected.map(company => company.headquarters)},
            {label: tr("County"), values: selected.map(company => company.county)},
            {label: tr("Equipment"), values: selected.map(company => company.equipment.map(item => tr(equipmentLabels[item])).join(", ") || missing)},
            {label: tr("Lanes"), values: selected.map(company => company.operations.map(item => tr(operationLabels[item])).join(", ") || missing)},
          ].map((row, index) => <tr key={row.label} className={cn("border-b border-border/60 last:border-0", index % 2 === 0 && "bg-muted/30")}><th scope="row" className="px-5 py-4 text-left font-medium text-muted-foreground">{row.label}</th>{row.values.map((value, i) => <td key={selected[i].slug} className={cn("px-5 py-4", index === 0 && "font-semibold tabular-nums")}>{value}</td>)}</tr>)}
        </tbody></table>
      </div>
    </section>
    <p className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm leading-6 text-muted-foreground">{es ? "Solo mostramos estadísticas públicas autorizadas. Las cifras corresponden a la antigüedad y frecuencia seleccionadas; no representan el sueldo de toda la empresa. Una muestra pequeña y las diferencias de puesto, jornada o turnos pueden afectar la comparación." : "Only authorised public statistics are shown. Figures match the selected tenure and pay frequency; they do not represent company-wide pay. Small samples and differences in role, hours or shifts can affect the comparison."}</p>
  </div>;
}
