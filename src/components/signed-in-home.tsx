"use client";
import Link from "next/link";
import { ArrowUpRight, FilePlus2, Building2, ClipboardList } from "lucide-react";
import { SiteHeader } from "./site-header";
import { useT } from "./language-provider";
export function SignedInHome() {
 const {locale} = useT(); const es = locale === "es";
 const actions = [
  {title:es?"Añadir nueva nómina":"Add a payslip",description:es?"Sube un PDF o importa desde Gmail. Si empiezas, prepara tus tres nóminas.":"Upload a PDF or import from Gmail. Start with three payslips.",href:"/report",Icon:FilePlus2},
  {title:es?"Comparar empresas":"Compare companies",description:es?"Explora el directorio y elige las empresas que quieres comparar.":"Explore the directory and choose employers to compare.",href:"/companies",Icon:Building2},
  {title:es?"Mis nóminas":"My payslips",description:es?"Tu historial, tus totales y el resumen de cada empresa, en un solo lugar.":"Your history, totals and each employer’s summary, all in one place.",href:"/payslips",Icon:ClipboardList}
 ];
 return <div className="min-h-screen bg-background text-foreground">
  <SiteHeader hidePrimaryLinks />
  <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-8 sm:py-14">
   <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">MyTruckPay</p>
   <h1 className="mt-2 font-heading text-[2rem] leading-tight font-semibold sm:text-5xl">{es?"¿Qué quieres hacer hoy?":"What would you like to do today?"}</h1>
   <p className="mt-2 text-sm text-muted-foreground sm:text-base">{es?"Elige una opción para continuar.":"Choose an option to continue."}</p>
   <nav aria-label={es?"Funciones principales":"Main actions"} className="mt-5 space-y-3 sm:mt-10 sm:space-y-5">
    {actions.map(({title,description,href,Icon},index)=><Link key={href} href={href} className={
     "group flex min-h-32 w-[calc(100%_-_1rem)] items-start gap-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:min-h-44 sm:w-4/5 sm:gap-6 sm:p-7 " +
     (index===0?"mr-auto border-accent bg-accent text-accent-foreground":index===1?"mx-auto border-primary bg-primary text-primary-foreground":"ml-auto border-border bg-card text-card-foreground")
    }>
     <span className="font-heading text-3xl font-semibold opacity-60 sm:text-5xl" aria-hidden="true">{index+1}</span>
     <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><Icon className="mb-2 size-5 sm:mb-3 sm:size-6" aria-hidden="true"/><ArrowUpRight className="size-5 shrink-0" aria-hidden="true"/></div><h2 className="font-heading text-[1.4rem] leading-tight font-semibold sm:text-3xl"><span className="sr-only">{index+1}. </span>{title}</h2><p className="mt-1.5 max-w-xl text-sm leading-5 opacity-85 sm:mt-2 sm:leading-6">{description}</p></div>
    </Link>)}
   </nav>
   <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 sm:mt-8 text-sm text-muted-foreground">
    <Link href="/report" className="inline-flex min-h-11 items-center underline underline-offset-4">{es?"¿Tienes nóminas de otra empresa?":"Payslips from another employer?"}</Link>
    <Link href="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-4">{es?"Privacidad y datos":"Privacy and data"}</Link>
   </div>
  </div>
 </div>;
}
