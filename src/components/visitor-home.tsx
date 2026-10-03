"use client";
import Link from "next/link";
import { ArrowRight, FileText, CalendarDays, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { SiteHeader } from "./site-header";
import { useMarket } from "./market-provider";
import { marketName } from "@/lib/markets";
import { useT } from "./language-provider";
export function VisitorHome() {
 const market = useMarket();
 const {locale} = useT(); const es = locale === "es";
 const steps = market === "US" ? (es ? [["Elige Estados Unidos", "Consulta empresas y aportaciones solo de este mercado."], ["Comparte tu experiencia", "Indica tus ingresos en USD y la empresa para la que conduces."], ["Revisa tu nómina", "Sube un pay stub de empleado y revisa los importes leídos en USD."]] : [["Choose United States", "Explore companies and driver reports from this market."], ["Share your experience", "Report your take-home pay in USD and the trucking company you drive for."], ["Review your pay stub", "Upload an employee pay stub and review the figures read in USD."]]) : es ? [
  ["Añade tres nóminas", "Importa desde Gmail o sube tres PDF de períodos consecutivos de la misma empresa."],
  ["Confirma tu empresa", "Revisa el nombre e indica el mes y año en que empezaste a trabajar allí."],
  ["Consulta tu resumen", "Comprueba tus importes, sigue tu historial y explora los datos disponibles de otras empresas."]
 ] : [
  ["Add three payslips", "Import from Gmail or upload three PDFs for consecutive periods from the same employer."],
  ["Confirm your employer", "Check the company name and enter the month and year you started working there."],
  ["See your summary", "Review your pay, follow your history and explore available data from other employers."]
 ];
 const icons = [FileText, CalendarDays, ChartNoAxesCombined];
 return <div className="min-h-screen bg-background text-foreground">
  <SiteHeader visitor />
  <div className="mx-auto max-w-6xl px-5 pb-8 pt-7 sm:px-8 sm:pb-12 sm:pt-20">
   <section className="max-w-3xl">
    {market === "ES" && <aside className="mb-5 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm"><p>{es ? "España: explora el catálogo de empresas. Los salarios aparecerán cuando existan datos verificados. El análisis automático de nóminas españolas todavía está en preparación." : "Spain: explore the company directory. Salaries will appear when verified data is available. Automatic Spanish payslip analysis is still in preparation."}</p><Link href="/companies" className="mt-3 inline-flex min-h-11 items-center font-semibold underline">{es ? "Ver empresas de España" : "Browse Spanish companies"}</Link></aside>}
    {market === "US" && <aside className="mb-5 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm"><p>{es ? "Estados Unidos: aportaciones salariales en dólares, separadas de Irlanda y España. Lectura inicial de pay stubs de empleados con importes etiquetados. Las liquidaciones de autónomos todavía no están admitidas." : "United States: driver-reported pay in US dollars, separate from Ireland and Spain. Initial employee pay stub reading supports labelled amounts. Owner-operator settlements are not supported yet."}</p><Link href="/companies" className="mt-3 inline-flex min-h-11 items-center font-semibold underline">{es ? "Ver empresas de Estados Unidos" : "Browse US trucking companies"}</Link></aside>}
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{`MyTruckPay · ${marketName(market, es)}`}</p>
    <h1 className="mt-4 font-heading text-[2.6rem] font-semibold leading-[1.03] tracking-tight sm:text-7xl">{es?"Tus nóminas, más claras.": market === "US" ? "Understand your trucking pay." : "Make sense of your payslips."}</h1>
    <p className="mt-4 max-w-2xl text-base leading-7 sm:mt-6 sm:text-lg sm:leading-8 text-muted-foreground">{es?"Entiende lo que cobras, reúne tu historial y compara los datos salariales disponibles de empresas de transporte.":"Understand your pay, keep your history together and compare available pay data from haulage companies."}</p>
    <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-5">
     <Link href="/account" className="inline-flex min-h-12 w-full items-center justify-center gap-4 sm:w-auto rounded-xl bg-accent px-7 py-3 text-base font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{es?"Empezar":"Get started"}<ArrowRight className="size-5" aria-hidden="true"/></Link>
     <Link href="/demo" className="inline-flex min-h-11 w-full items-center justify-center gap-2 sm:w-auto text-sm font-medium underline underline-offset-4">{es?"Ver una demo":"Try the demo"}</Link>
    </div>
    <p className="mt-4 text-sm text-muted-foreground">{market === "US" ? (es ? "Mercado inicial: todavía no hay nóminas estadounidenses verificadas." : "Early US market: no verified US pay stubs yet.") : es?"Empieza con tu correo. Sin crear una contraseña.":"Start with your email. No account password to create."}</p>
   </section>
   <section aria-label={es?"Cómo funciona":"How it works"} className="mt-8 grid gap-3 sm:mt-16 sm:gap-4 md:grid-cols-3">
    {steps.map(([title,body],index)=>{const Icon=icons[index];return <article key={title} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
     <div className="flex items-center justify-between"><Icon className="size-10 rounded-xl bg-accent/20 p-2 text-foreground" aria-hidden="true"/><span className="font-mono text-sm text-muted-foreground">0{index+1}</span></div>
     <h2 className="mt-3 font-heading text-2xl sm:mt-5 font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>})}
   </section>
   <aside className="mt-8 flex gap-3 rounded-xl border border-border p-5 text-sm leading-6 text-muted-foreground">
    <ShieldCheck className="mt-1 size-5 shrink-0" aria-hidden="true"/>
    <div><p>{es?"Tus documentos se procesan para leer los datos. Tú revisas las cifras antes de guardarlas. Las comparativas se muestran cuando hay datos suficientes.":"Documents are processed to read their data. You review the figures before saving. Comparisons appear when enough data is available."}</p><p className="mt-2">{es?"Sube solo tus propias nóminas y revisa los datos antes de guardarlos.":"Upload only your own payslips and review the data before saving."}</p><Link href="/privacy" className="mt-2 inline-block font-medium text-foreground underline underline-offset-4">{es?"Privacidad y datos":"Privacy and data"}</Link></div>
   </aside>
  </div>
 </div>;
}
