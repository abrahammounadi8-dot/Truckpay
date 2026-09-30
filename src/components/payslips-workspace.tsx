"use client";

import Link from "next/link";
import { useState } from "react";
import { PayslipList } from "@/components/payslip-list";
import { WipeSession } from "@/components/wipe-session";
import { useT } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PayslipsWorkspace({ publicationEnabled = false }: { publicationEnabled?: boolean }) {
  const { t, locale } = useT();
  const [unlocked, setUnlocked] = useState(false);
  const [hasPayslips, setHasPayslips] = useState(false);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {t("payslips.kicker")}
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("payslips.title")}</h1>

        </div>
        {hasPayslips && <Link href="/payslips/new" className={cn(buttonVariants(), "bg-accent text-accent-foreground hover:bg-accent/90")}>
          {t("nav.addPayslip")}
        </Link>}
      </div>
      {hasPayslips && <section aria-labelledby="publication-title" className="mt-6 rounded-xl border border-accent/50 bg-accent/10 p-5">
        <h2 id="publication-title" className="font-heading text-xl font-semibold">{publicationEnabled ? (locale === "es" ? "Ya compartes estadísticas en Empresas" : "You are sharing statistics in Companies") : (locale === "es" ? "¿Quieres que tus datos aparezcan en Empresas?" : "Want your data to appear in Companies?")}</h2>
        <p className="mt-2 text-sm leading-6">{publicationEnabled ? (locale === "es" ? "Tus aportaciones válidas ayudan a otros conductores a comparar salarios. Puedes gestionar tu permiso cuando quieras." : "Your qualifying contributions help other drivers compare pay. You can manage your permission at any time.") : (locale === "es" ? "Comparte las estadísticas de tus nóminas para ayudar a otros conductores a comparar salarios. Participar es opcional: revisa qué se publica antes de activar." : "Share statistics from your payslips to help other drivers compare pay. Participation is optional: review what is published before enabling it.")}</p>
        <Link href="/account#publication" className={cn(buttonVariants(), "mt-4 bg-accent text-accent-foreground hover:bg-accent/90")}>{publicationEnabled ? (locale === "es" ? "Gestionar publicación" : "Manage publication") : (locale === "es" ? "Revisar y activar" : "Review and enable")}</Link>
      </section>}
      {!unlocked && <section aria-label={locale === "es" ? "Cómo funciona MyTruckPay" : "How MyTruckPay works"} className="mt-6 grid gap-4 rounded-xl border border-accent/40 bg-accent/10 p-5 sm:grid-cols-2">
        <div><h2 className="font-heading text-xl font-semibold">{locale === "es" ? "1. Completa tu resumen" : "1. Complete your summary"}</h2><p className="mt-2 text-sm leading-6">{locale === "es" ? "Añade tres nóminas de períodos consecutivos, de la misma empresa y con la misma frecuencia. Indica una vez el mes y año en que empezaste allí." : "Add three consecutive payslips from the same employer and pay frequency. Enter your start month and year once for that employer."}</p></div>
        <div><h2 className="font-heading text-xl font-semibold">{locale === "es" ? "2. Conserva tu historial" : "2. Keep your history"}</h2><p className="mt-2 text-sm leading-6">{locale === "es" ? "Después sigue guardando nóminas de tu empresa actual o de empresas anteriores. Cada empresa mantiene su historial; el grupo de tres no mezcla empresas." : "Then keep saving payslips from your current and previous employers. Each employer has its own history; never mix employers in a set of three."}</p></div>
        <p className="text-xs text-muted-foreground sm:col-span-2">{locale === "es" ? "La empresa aparece en Empresas cuando autorizas la publicación y completas tres nóminas válidas con su antigüedad." : "The employer appears in Companies when you allow publication and complete three qualifying payslips with employment tenure."}</p>
      </section>}
      <div id="summary" className="mt-8 scroll-mt-48">
        <PayslipList onHasPayslipsChange={setHasPayslips} onAccessChange={setUnlocked} />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/profile" className="underline">
          {t("payslips.profile")}
        </Link>
      </p>
      <div className="mt-10 border-t border-border pt-6">
        <WipeSession />
      </div>
    </div>
  );
}
