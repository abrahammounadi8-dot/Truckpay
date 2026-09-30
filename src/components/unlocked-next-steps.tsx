"use client";

import Link from "next/link";
import { ArrowRight, Building2, ClipboardList } from "lucide-react";
import { useT } from "./language-provider";
import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, [string, string, string, string, string]> = {
  es: ["Tu siguiente paso", "Empresas", "Revisa tu historial, consulta el análisis y sigue añadiendo nóminas.", "Explora transportistas y consulta sus datos salariales disponibles.", "Ver mi resumen"],
  en: ["Your next step", "Company directory", "Review your history, open your analysis and keep adding payslips.", "Explore hauliers and view their available pay data.", "View my summary"],
  de: ["Dein nächster Schritt", "Firmenverzeichnis", "Prüfe deinen Verlauf, öffne die Analyse und füge weitere Abrechnungen hinzu.", "Entdecke Transportunternehmen und ihre verfügbaren Lohndaten.", "Meine Analyse öffnen"],
  pl: ["Twój następny krok", "Katalog firm", "Sprawdź historię i analizę oraz dodawaj kolejne paski wypłaty.", "Przeglądaj przewoźników i dostępne dane o wynagrodzeniach.", "Zobacz moją analizę"],
  pt: ["O teu próximo passo", "Diretório de empresas", "Consulta o histórico e a análise e continua a adicionar recibos.", "Explora transportadoras e os dados salariais disponíveis.", "Ver a minha análise"],
  lt: ["Kitas žingsnis", "Įmonių katalogas", "Peržiūrėkite istoriją, analizę ir toliau pridėkite algalapius.", "Naršykite vežėjus ir turimus atlyginimų duomenis.", "Peržiūrėti mano analizę"],
  ro: ["Următorul pas", "Catalogul companiilor", "Consultă istoricul și analiza și continuă să adaugi fluturași.", "Explorează transportatorii și datele salariale disponibile.", "Vezi analiza mea"],
  ru: ["Следующий шаг", "Каталог компаний", "Просматривайте историю и анализ и добавляйте новые расчётные листки.", "Изучайте перевозчиков и доступные данные об оплате.", "Открыть мой анализ"],
};

export function UnlockedNextSteps({ inPayslips = false }: { inPayslips?: boolean }) {
  const { locale, t } = useT();
  const c = copy[locale];
  return <section className="my-6 text-left" aria-label={c[0]}>
    <h2 className="font-heading text-2xl font-semibold">{c[0]}</h2>
    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
      {[
        { title: t("payslips.title"), description: c[2], href: inPayslips ? "/payslips#summary" : "/payslips", action: inPayslips ? c[4] : t("payslips.title"), Icon: ClipboardList },
        { title: c[1], description: c[3], href: "/companies", action: c[1], Icon: Building2 },
        { title: locale === "es" ? "Añadir nueva empresa" : "Add new company", description: locale === "es" ? "Importa tres nóminas consecutivas de otra empresa e indica cuándo empezaste a trabajar allí." : "Import three consecutive payslips from another employer and enter when you started working there.", href: "/report", action: locale === "es" ? "Añadir nueva empresa" : "Add new company", Icon: Building2 },
      ].map(({ title, description, href, action, Icon }) => <Link key={href} href={href} className="last:col-span-2 md:last:col-span-1 group flex min-w-0 flex-col rounded-xl border-2 border-accent bg-card p-3 text-card-foreground no-underline transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:p-5">
        <Icon className="mb-3 size-9 rounded-lg bg-accent p-1.5 text-accent-foreground" aria-hidden="true" />
        <h3 className="font-heading text-xl font-semibold">{title}</h3>
        <p className="mb-5 mt-2 text-sm leading-6">{description}</p>
        <span className="mt-auto flex items-center justify-between gap-2 rounded-lg bg-accent px-2 py-3 text-sm font-semibold text-accent-foreground sm:px-4">{action}<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></span>
      </Link>)}
    </div>
  </section>;
}
