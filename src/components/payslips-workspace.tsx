"use client";
import Link from "next/link";
import { useState } from "react";
import { PayslipList } from "./payslip-list";
import { WipeSession } from "./wipe-session";
import { useT } from "./language-provider";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export function PayslipsWorkspace({ publicationEnabled = false }: { publicationEnabled?: boolean }) {
  const { t, locale } = useT();
  const es = locale === "es";
  const [hasPayslips, setHasPayslips] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const publication = <section aria-labelledby="publication-title" className={cn("rounded-xl p-4 transition-colors sm:p-5", analysisComplete ? "border-2 border-accent bg-accent/20 shadow-md ring-2 ring-accent/30" : "border border-accent/50 bg-accent/10")}>
    <p className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", analysisComplete && "bg-accent text-accent-foreground")}>{es ? "Opcional · Estadísticas públicas" : "Optional · Public statistics"}</p>
    {analysisComplete && <p role="status" className="mt-3 font-semibold">{es ? "Análisis completado. Puedes revisar aquí tu participación voluntaria." : "Analysis complete. You can review your optional contribution here."}</p>}
    <h2 id="publication-title" className="mt-2 font-heading text-xl font-semibold">{publicationEnabled ? (es ? "Publicación autorizada" : "Publication authorised") : (es ? "¿Quieres aparecer en la lista de empresas?" : "Want to contribute to Companies?")}</h2>
    <p className="mt-2 text-sm leading-6">{es ? "Tu nombre, correo y documentos no se publican. Las estadísticas requieren tu autorización y tres nóminas válidas consecutivas de la misma empresa, con tu mes de inicio indicado." : "Your name, email and documents are not published. Statistics require your permission and three qualifying consecutive payslips from the same employer, with your start month entered."}</p>
    <Link href="/account#publication" className={cn(buttonVariants({variant: analysisComplete ? "default" : "outline"}), "mt-3 min-h-11 h-auto w-full whitespace-normal px-4 py-2 text-center sm:w-auto", analysisComplete && "bg-accent text-accent-foreground hover:bg-accent/90")}>{publicationEnabled ? (es ? "Gestionar permiso" : "Manage permission") : (es ? "Revisar y activar" : "Review and enable")}</Link>
  </section>;
  return <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("payslips.kicker")}</p>
    <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("payslips.title")}</h1>
      <Link href="/payslips/new" className={cn(buttonVariants(), "min-h-12 h-auto whitespace-normal bg-accent px-4 py-3 text-center text-accent-foreground hover:bg-accent/90")}>{hasPayslips ? t("nav.addPayslip") : (es ? "Subir mi primera nómina" : "Upload my first payslip")}</Link>
    </div>
    <p className="mt-3 text-sm text-muted-foreground">{es ? "Guarda cada nómina por separado. Compartir estadísticas es opcional." : "Save each payslip individually. Sharing statistics is optional."}</p>
    <details className="mt-4 rounded-xl border border-border p-4 text-sm leading-6">
      <summary className="cursor-pointer font-semibold">{es ? "Cómo empezar · 3 pasos" : "Getting started · 3 steps"}</summary>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>{es ? "Sube una nómina, revisa los datos e indica cuándo empezaste en la empresa." : "Upload a payslip, review its details and enter when you started at the employer."}</li>
        <li>{es ? "Completa tres períodos consecutivos de la misma empresa y frecuencia para abrir tu análisis." : "Complete three consecutive periods from the same employer and pay frequency to unlock your analysis."}</li>
        <li>{es ? "Si quieres contribuir a Empresas, revisa y activa el permiso de publicación." : "If you want to contribute to Companies, review and enable publication permission."}</li>
      </ol>
    </details>
    <div id="summary" className="mt-5 scroll-mt-24"><PayslipList onHasPayslipsChange={setHasPayslips} onAccessChange={setAnalysisComplete} afterProgress={publication} /></div>
    <p className="mt-6 text-sm"><Link href="/profile" className="inline-flex min-h-11 items-center underline">{t("payslips.profile")}</Link></p>
    <div className="mt-10 border-t border-border pt-6"><WipeSession /></div>
  </div>;
}
