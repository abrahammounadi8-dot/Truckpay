"use client";
import Link from "next/link";
import { ArrowRight, FileText, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { SiteHeader } from "./site-header";
import { HomeCompanyIntro } from "./home-company-intro";
import { useMarket } from "./market-provider";
import { useT } from "./language-provider";

export function VisitorHome() {
  const market = useMarket();
  const { locale } = useT();
  const es = locale === "es";
  const c = (spanish: string, english: string) => es ? spanish : english;
  return <div className="min-h-screen bg-background text-foreground">
    <SiteHeader visitor />
    <main className="mx-auto max-w-6xl space-y-8 px-4 pb-10 pt-6 sm:space-y-10 sm:px-8 sm:pt-10">
      <HomeCompanyIntro />
      <section aria-labelledby="home-payroll-title">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c("También para tus nóminas", "Your payslips, too")}</p>
        <h2 id="home-payroll-title" className="mt-2 font-heading text-3xl font-semibold">{c("Entiende lo que cobras. Guarda tu historial.", "Understand your pay. Keep your history.")}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{c("Tu espacio privado complementa la comparación: revisa tus nóminas y decide si quieres aportar datos salariales a las empresas.", "Your private workspace complements company comparison: review your payslips and choose whether to contribute pay data.")}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border bg-card p-5 sm:p-6"><FileText className="size-10 rounded-xl bg-accent/20 p-2" aria-hidden="true" /><h3 className="mt-3 font-heading text-2xl font-semibold">{c("Revisa tus nóminas", "Review your payslips")}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c("Añade tus documentos, confirma la empresa y revisa los importes leídos.", "Add your documents, confirm the employer and review the figures read.")}</p><Link href="/account" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">{c("Entrar a mi espacio", "Open my workspace")}<ArrowRight className="size-4" aria-hidden="true" /></Link></article>
          <article className="rounded-2xl border bg-card p-5 sm:p-6"><ChartNoAxesCombined className="size-10 rounded-xl bg-accent/20 p-2" aria-hidden="true" /><h3 className="mt-3 font-heading text-2xl font-semibold">{c("Sigue tu evolución", "Track your progress")}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c("Reúne tus cobros por empresa y consulta cómo cambian con el tiempo.", "Keep payments together by employer and review how they change over time.")}</p><Link href="/demo" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold underline underline-offset-4">{c("Ver cómo funciona", "See how it works")}<ArrowRight className="size-4" aria-hidden="true" /></Link></article>
        </div>
        {market === "US" && <p className="mt-4 rounded-xl border p-4 text-sm leading-6 text-muted-foreground">{c("USA: lectura inicial de nóminas de empleados en USD. Las liquidaciones de autónomos/1099 todavía no están admitidas.", "USA: initial employee pay stub reading in USD. Owner-operator/1099 settlements are not supported yet.")}</p>}
        {market === "ES" && <p className="mt-4 rounded-xl border p-4 text-sm leading-6 text-muted-foreground">{c("España: explora las empresas. El análisis automático de nóminas españolas sigue en preparación.", "Spain: explore employers. Automatic Spanish payslip analysis is still in preparation.")}</p>}
      </section>
      <aside className="flex gap-3 rounded-xl border p-5 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-1 size-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold text-foreground">{c("Tus documentos son privados. Tú decides qué compartes.", "Your documents are private. You choose what to share.")}</p><p className="mt-1">{c("Tu nombre, correo y documentos no se publican. Aportar estadísticas salariales requiere tu autorización.", "Your name, email and documents are not published. Contributing salary statistics requires your permission.")}</p><Link href="/privacy" className="mt-2 inline-flex min-h-11 items-center font-medium underline underline-offset-4">{c("Privacidad y datos", "Privacy and data")}</Link></div></aside>
    </main>
  </div>;
}
