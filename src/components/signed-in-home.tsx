"use client";
import Link from "next/link";
import { ArrowRight, FilePlus2, Building2, ClipboardList, ChartNoAxesCombined, UserRound, MessageSquare, ShieldCheck } from "lucide-react";
import { SiteHeader } from "./site-header";
import { useT } from "./language-provider";

export function SignedInHome() {
 const {locale} = useT(); const es = locale === "es";
 const c = (a:string,b:string) => es?a:b;
 const actions = [
  {title:c('Explorar empresas','Explore companies'),description:c('Conoce las empresas y compara la información disponible.','Discover employers and compare available information.'),href:'/companies',Icon:Building2},
  {title:c('Mi perfil laboral','My employment profile'),description:c('Mantén tus empresas y tu experiencia al día.','Keep your employers and experience up to date.'),href:'/profile',Icon:UserRound},
  {title:c('Opiniones y sugerencias','Reviews and suggestions'),description:c('Comparte tu experiencia o ayúdanos a mejorar.','Share your experience or help us improve.'),href:'/opinions',Icon:MessageSquare},
 ];
 const focus='focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';
 return <div className="min-h-screen bg-background text-foreground">
  <SiteHeader hidePrimaryLinks />
  <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12 pt-6 sm:space-y-8 sm:px-8 sm:pt-10">
   <header className="flex flex-wrap items-center justify-between gap-4">
    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c('Tu espacio personal','Your personal space')}</p><h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{c('Bienvenido a MyTruckPay','Welcome to MyTruckPay')}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{c('Tus nóminas, tu evolución y tu próximo paso. Todo empieza aquí.','Your payslips, your progress and your next step. It all starts here.')}</p></div>
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-medium"><ShieldCheck className="size-4 text-primary" aria-hidden="true"/>{c('Nóminas privadas','Private payslips')}</span>
   </header>
   <section aria-labelledby="home-payslips" className="grid overflow-hidden rounded-3xl border border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/10 lg:grid-cols-[1.35fr_1fr]">
    <div className="p-6 sm:p-8 lg:p-10">
     <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><ClipboardList className="size-6" aria-hidden="true"/></span>
     <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-accent">{c('Entiende lo que cobras','Understand your pay')}</p>
     <h2 id="home-payslips" className="mt-2 font-heading text-4xl font-semibold sm:text-5xl">{c('Tus nóminas, más claras.','A clearer view of your payslips.')}</h2>
     <p className="mt-3 max-w-md text-sm leading-6 text-primary-foreground/85">{c('Consulta tus cobros, revisa cada concepto y sigue tu historial por empresa, a tu ritmo.','Check your payments, review each item and follow your history by employer, at your own pace.')}</p>
     <Link href="/payslips" className={'mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground transition-colors hover:bg-accent/90 sm:w-auto '+focus}>{c('Ver mis nóminas','View my payslips')}<ArrowRight className="size-5" aria-hidden="true"/></Link>
    </div>
    <div className="flex flex-col justify-center border-t border-primary-foreground/15 bg-primary-foreground/5 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
     <FilePlus2 className="size-7 text-accent" aria-hidden="true"/><h3 className="mt-4 font-heading text-2xl font-semibold">{c('¿Una nueva nómina?','A new payslip?')}</h3><p className="mt-2 text-sm leading-6 text-primary-foreground/85">{c('Añádela a tu historial para tener tus cobros siempre a mano. Si acabas de llegar, empieza con la primera.','Add it to your history to keep your payments close at hand. If you are new here, start with your first one.')}</p>
     <Link href="/payslips/new" className={'mt-5 inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-primary-foreground/30 px-4 py-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 '+focus}>{c('Añadir nómina','Add a payslip')}<ArrowRight className="size-4" aria-hidden="true"/></Link>
    </div>
   </section>
   <Link href="/payslips" className={'group flex flex-col gap-4 rounded-2xl border border-accent/60 bg-accent/10 p-5 transition-colors hover:bg-accent/20 sm:flex-row sm:items-center sm:gap-5 sm:p-6 '+focus}>
    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/30"><ChartNoAxesCombined className="size-6" aria-hidden="true"/></span>
    <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c('Una mirada a tu evolución','A look at your progress')}</p><h2 className="mt-1 font-heading text-2xl font-semibold">{c('Tu revisión trimestral','Your quarterly review')}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{c('Revisa cómo cambian tus cobros y qué datos conviene comprobar.','See how your payments change and which details are worth checking.')}</p></div>
    <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">{c('Ver revisión','View review')}<ArrowRight className="size-4" aria-hidden="true"/></span>
   </Link>
   <section aria-labelledby="home-explore"><h2 id="home-explore" className="mb-4 font-heading text-2xl font-semibold">{c('Más para tu día a día','More for your day-to-day')}</h2><nav aria-label={c('Explorar mi espacio','Explore my space')} className="grid gap-3 sm:grid-cols-3">{actions.map(({title,description,href,Icon})=><Link key={href} href={href} className={'group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/30 '+focus}><div className="flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-muted"><Icon className="size-5 text-primary" aria-hidden="true"/></span><ArrowRight className="size-4 text-muted-foreground" aria-hidden="true"/></div><h3 className="mt-4 font-heading text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></Link>)}</nav></section>
   <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-xs leading-6 text-muted-foreground"><ShieldCheck className="size-4" aria-hidden="true"/>{c('Tú decides qué compartes.','You decide what you share.')}<Link href="/privacy" className={'inline-flex min-h-11 items-center underline underline-offset-4 '+focus}>{c('Privacidad y datos','Privacy and data')}</Link></p>
  </div>
 </div>;
}
