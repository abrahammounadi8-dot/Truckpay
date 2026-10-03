"use client";
import Link from "next/link";
import { ArrowRight, ArrowLeftRight, Building2, CircleCheck } from "lucide-react";
import { useMarket } from "./market-provider";
import { useT } from "./language-provider";
import { marketName } from "@/lib/markets";

export function HomeCompanyIntro() {
  const market = useMarket();
  const { locale } = useT();
  const es = locale === "es";
  const c = (spanish: string, english: string) => es ? spanish : english;
  const steps = [
    [c("Busca empresas", "Find companies"), c("Explora el directorio de tu país.", "Explore employers in your country.")],
    [c("Elige hasta tres", "Choose up to three"), c("Marca las empresas que te interesen para compararlas.", "Select the employers you want to compare.")],
    [c("Compara lado a lado", "Compare side by side"), c("Consulta sus datos y los salarios disponibles.", "Review their details and available pay data.")],
  ];
  return <section aria-labelledby="home-company-title" className="grid overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/10 lg:grid-cols-[1.4fr_1fr]">
    <div className="p-6 sm:p-9 lg:p-10">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent"><Building2 className="size-4" aria-hidden="true" />{c("Empresas de transporte", "Trucking companies")} · {marketName(market, es)}</p>
      <h1 id="home-company-title" className="mt-4 max-w-xl font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">{c("Compara empresas. Elige tu próximo paso.", "Compare employers. Choose your next move.")}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-primary-foreground/85">{c("Conoce las empresas de transporte y compara la información disponible antes de decidir dónde trabajar.", "Explore trucking companies and compare available information before deciding where to work.")}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/companies" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{c("Buscar y comparar empresas", "Find and compare companies")}<ArrowRight className="size-5" aria-hidden="true" /></Link>
        <Link href="/compare" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-foreground/30 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground/10">{c("Abrir comparador", "Open comparison")}<ArrowLeftRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <p className="mt-4 text-xs leading-5 text-primary-foreground/75">{c("Explora sin iniciar sesión. Los salarios se muestran cuando hay aportaciones autorizadas y datos suficientes.", "Browse without signing in. Pay appears when authorised contributions and enough data are available.")}</p>
    </div>
    <div className="border-t border-primary-foreground/15 bg-primary-foreground/5 p-6 sm:p-9 lg:border-l lg:border-t-0">
      <h2 className="font-heading text-xl font-semibold">{c("Así funciona la comparación", "How comparison works")}</h2>
      <ol className="mt-5 space-y-5">{steps.map(([title, body], index) => <li key={title} className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{index + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-primary-foreground/75">{body}</p></div></li>)}</ol>
      <div className="mt-6 border-t border-primary-foreground/15 pt-5"><p className="text-xs font-semibold uppercase tracking-wide text-accent">{c("Qué puedes consultar", "What you can explore")}</p><ul className="mt-3 space-y-2">{[c("Empresa, ubicación y actividad", "Company, location and operations"), c("Datos salariales disponibles", "Available pay data"), c("Misma frecuencia de pago y antigüedad", "Same pay frequency and tenure")].map(label => <li key={label} className="flex items-center gap-2 text-sm text-primary-foreground/85"><CircleCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />{label}</li>)}</ul></div>
    </div>
  </section>;
}
