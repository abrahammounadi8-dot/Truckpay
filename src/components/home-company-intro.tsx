"use client";
import Link from "next/link";
import { ArrowRight, ArrowLeftRight, Building2, FileText } from "lucide-react";
import { useMarket } from "./market-provider";
import { useT } from "./language-provider";
import { marketName } from "@/lib/markets";

export function HomeCompanyIntro() {
  const market = useMarket();
  const { locale } = useT();
  const es = locale === "es";
  const c = (spanish: string, english: string) => es ? spanish : english;
  return <section aria-labelledby="home-company-title" className="overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
    <div className="p-6 sm:p-9 lg:p-10">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent"><Building2 className="size-4" aria-hidden="true" />{c("Empresas de transporte", "Trucking companies")} · {marketName(market, es)}</p>
      <h1 id="home-company-title" className="mt-4 max-w-xl font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">{c("Tu trabajo. Tu sueldo.", "Your job. Your pay.")}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-primary-foreground/85">{c("Compara empresas y revisa tus nóminas.", "Compare employers and review your payslips.")}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/companies" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{c("Empresas", "Companies")}<ArrowRight className="size-5" aria-hidden="true" /></Link>
        <Link href="/compare" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-foreground/30 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground/10">{c("Comparar", "Compare")}<ArrowLeftRight className="size-4" aria-hidden="true" /></Link>
        <Link href="/payslips" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-foreground/30 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground/10">{c("Mis nóminas", "My payslips")}<FileText className="size-4" aria-hidden="true" /></Link>
      </div>
      <p className="mt-4 text-xs leading-5 text-primary-foreground/75">{c("Empresas sin registro. Nóminas privadas.", "Browse companies without signing in. Private payslips.")}</p>
    </div>
  </section>;
}
