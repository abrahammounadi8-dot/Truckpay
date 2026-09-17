"use client";
import Link from "next/link";
import { useT } from "@/components/language-provider";

type Access = { unlocked: boolean; have: number; required: number; needsDetails: boolean };
export function WelcomeBoard({ access }: { access: Access }) {
  const { locale } = useT();
  const es = locale === "es";
  const text = (a: string, b: string) => es ? a : b;
  const action = "inline-flex rounded-lg px-5 py-3 font-semibold bg-accent text-accent-foreground hover:opacity-90";
  return <div>
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <p className="text-sm tracking-widest text-accent uppercase">{text("Para conductores de transporte en Irlanda", "For haulage drivers in Ireland")}</p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">{text("Tus nóminas claras. Tus opciones también.", "Understand your pay. Know your options.")}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8">{text("Lleva el registro de tus nóminas durante el año, consulta tus ingresos y deducciones y detecta diferencias que convenga revisar. Con tres nóminas distintas, desbloquea la comparación salarial.", "Keep your payslips throughout the year, review earnings and deductions, and spot differences worth checking. Three distinct payslips unlock salary comparisons.")}</p>
        <div className="mt-8 flex flex-wrap gap-4"><Link className={action} href="/payslips/new">{access.have ? text("Añadir otra nómina", "Add another payslip") : text("Añadir mi primera nómina", "Add my first payslip")}</Link><Link href="/payslips" className="inline-flex items-center underline">{text("Ir a Mis nóminas", "Go to My payslips")}</Link></div>
      </div>
    </section>
    <section className="mx-auto grid max-w-5xl gap-6 px-5 py-10 md:grid-cols-2">
      <article className="rounded-xl border border-border bg-card p-7"><p className="text-sm text-muted-foreground">{text("Útil desde la primera", "Useful from the first payslip")}</p><h2 className="mt-2 text-3xl font-semibold">{text("Mis nóminas", "My payslips")}</h2><p className="mt-4 leading-7">{text("Guarda todas las nóminas del año en el mismo lugar. Consulta cada pago, sus deducciones y los acumulados que aparecen en el documento. Puedes empezar con una sola.", "Keep the year's payslips in one place. Review each payment, deductions and year-to-date figures printed on the document. Start with just one.")}</p><Link className="mt-5 inline-block underline" href="/payslips">{text("Abrir mi registro", "Open my records")}</Link></article>
      <article className="rounded-xl border border-border bg-card p-7"><p className="text-sm text-muted-foreground">{access.unlocked ? text("Acceso desbloqueado", "Access unlocked") : text("Se desbloquea con tres nóminas", "Unlocks with three payslips")}</p><h2 className="mt-2 text-3xl font-semibold">{text("Comparar salarios", "Compare salaries")}</h2><p className="mt-4 leading-7">{text("Consulta empresas y compara salarios cuando haya datos suficientes. Utilizamos las mismas nóminas: no tienes que subirlas dos veces. El acceso no garantiza resultados para todas las empresas.", "Explore companies and compare salaries where enough data exists. Use the same payslips without uploading twice. Access does not guarantee results for every company.")}</p>{access.unlocked && <Link className="mt-5 inline-block underline" href="/compare">{text("Comparar salarios", "Compare salaries")}</Link>}</article>
    </section>
    <section className="mx-auto max-w-5xl px-5 pb-12">
      <div className="rounded-xl border border-border bg-card p-7">
        <h2 className="text-2xl font-semibold">{access.unlocked ? text("Ya puedes acceder a la comparación", "Comparisons are now available") : text("Tu camino para desbloquear la comparación", "Your path to unlocking comparisons")}</h2>
        <p className="mt-3 font-medium">{access.have} / {access.required} {text("nóminas distintas guardadas", "distinct payslips saved")}</p>
        <progress className="mt-3 h-3 w-full accent-amber-500" max={access.required} value={access.have} aria-label={text("Nóminas para desbloquear comparación", "Payslips to unlock comparisons")} />
        <ol className="mt-6 grid gap-5 sm:grid-cols-3"><li><strong>1. {text("Añade", "Add")}</strong><p>{text("Sube un PDF o una foto, o introduce los datos de tu nómina.", "Upload a PDF or photo, or enter your payslip details.")}</p></li><li><strong>2. {text("Revisa y guarda", "Review and save")}</strong><p>{text("Comprueba las cifras, la empresa y las fechas del periodo.", "Check the figures, employer and pay-period dates.")}</p></li><li><strong>3. {text("Desbloquea", "Unlock")}</strong><p>{text("Completa tus tres últimas nóminas de la misma empresa para comparar.", "Complete your latest three payslips from the same employer to compare.")}</p></li></ol>
        {access.needsDetails && <p role="status" className="mt-5">{text("Ya tienes tres nóminas. Revisa que correspondan a la misma empresa y que todas tengan inicio y fin del periodo. Puedes completar la empresa en tu perfil.", "You have three payslips. Check that they belong to the same employer and each has a period start and end. You can complete employer details in your profile.")} <Link className="underline" href="/profile">{text("Revisar perfil", "Review profile")}</Link></p>}
      </div>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">{text("Antes de añadir una nómina, consulta cómo se tratan tus datos. No incluyas PPSN, número de permiso ni número de empleado. Revisar una nómina no equivale a certificar que el pago sea correcto.", "Before adding a payslip, check how your data is handled. Do not enter your PPSN, licence or employee number. Reviewing a payslip does not certify that payment is correct.")} <Link className="underline" href="/privacy">{text("Privacidad y datos", "Privacy and data")}</Link></p>
    </section>
  </div>;
}
