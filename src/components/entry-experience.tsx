"use client";

import Link from "next/link";
import { UnlockedNextSteps } from "./unlocked-next-steps";
import { AccountLink } from "./account-link";
import { SiteHeader } from "./site-header";
import type { Locale } from "@/lib/i18n";

import { useState } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { Building2, Building2Icon, ClipboardList, CircleHelp, ShieldCheck } from "lucide-react";
import { useT } from "@/components/language-provider";
import { localeMeta } from "@/lib/i18n";
import { entryCopy, explanationCopy, choiceCopy } from "@/lib/entry-copy";

export function EntryHeader() {
  return <header><div className="mtp-top">
    <div className="mtp-entry-brand">
    <Link href="/" className="mtp-logo mtp-truck-logo" aria-label="MyTruckPay">
      <svg viewBox="0 0 340 76" width="340" height="76" aria-hidden="true" focusable="false">
        <rect x="8" y="12" width="240" height="43" rx="5" fill="none" stroke="#E2B14A" strokeWidth="2.5" />
        <text x="128" y="42" textAnchor="middle" fill="#ffffff" fontFamily="var(--font-heading-family), sans-serif" fontSize="36" fontWeight="500" letterSpacing=".2">MyTruckPay</text>
        <path d="M261 55V17q0-5 5-5h28q7 0 10 7l11 18v18Z" fill="#E2B14A" />
        <path d="M270 22h24l8 14h-32Z" fill="#1E2A3A" />
        <text x="284" y="49" textAnchor="middle" fill="#1E2A3A" fontFamily="sans-serif" fontSize="10" fontWeight="700" letterSpacing=".3">MTP</text>
        <path d="M10 59h308" stroke="#E2B14A" strokeWidth="3" strokeLinecap="round" />
        <path d="M307 47h7" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        {[43, 223, 288].map(x => <g key={x}><circle cx={x} cy="60" r="10" fill="#1E2A3A" stroke="#E2B14A" strokeWidth="3" /><circle cx={x} cy="60" r="3" fill="#ffffff" /></g>)}
      </svg>
    </Link>
    <span className="mtp-country">Ireland</span>
    </div>
    <div className="mtp-header-account"><AccountLink /></div>
    </div><LanguageSwitcher />
  </header>;
}

export function EntryExperience({ access }: { access: { have: number; required: number; unlocked: boolean } | null }) {
  const { locale, t } = useT();
  const [choose, setChoose] = useState(false);
  const copy = entryCopy[locale];
  const about = explanationCopy[locale];
  const choices = choiceCopy[locale];
  return <div className="mtp-experience mtp-entry" lang={localeMeta[locale].htmlLang}>
    <div className="mtp-window">
      <SiteHeader hidePrimaryLinks />
      {!access?.unlocked && <nav className="mtp-entry-shortcuts" aria-label={t("nav.myTruckPay")}>
        <Link href="/payslips" className="mtp-shortcut-primary"><ClipboardList size={17} aria-hidden="true" />{t("nav.myTruckPay")}</Link>
        <Link href="/companies" className="mtp-shortcut-primary"><Building2 size={17} aria-hidden="true" />{t("companies.title")}</Link>
        <Link href="/report" className="mtp-shortcut-primary mtp-shortcut-new"><Building2Icon size={17} aria-hidden="true" />{locale === "es" ? "Añadir nueva empresa" : "Add new company"}</Link>
        <Link href="/welcome"><CircleHelp size={17} aria-hidden="true" />{t("access.howItWorks")}</Link>
      </nav>}
      <div className="mtp-content">
        <p className="mtp-kicker">{copy[3]}</p>
        <h2>{copy[4]}</h2>
        {!access?.unlocked && <p className="mtp-lead">{copy[5]}</p>}
        <section className="mtp-entry-progress" aria-label={t("analysis.title")}>
          <ShieldCheck size={22} aria-hidden="true" />
          <div>
            <p>{access ? access.unlocked ? t("access.unlocked") : t("access.locked", {have: access.have, need: access.required}) : t("payslips.loadError")}</p>
            {access && <progress value={Math.min(access.have, access.required)} max={access.required} aria-label={t("analysis.title")} />}
            {access?.unlocked && <Link href="/payslips#summary">{t("payslips.title")} →</Link>}
          </div>
        </section>
        {access?.unlocked ? <UnlockedNextSteps /> : <button type="button" className="mtp-main" aria-expanded={choose} aria-controls="entry-choices" onClick={() => setChoose(!choose)}>{copy[6]}</button>}
        {choose && <div id="entry-choices" className="mtp-add-options">
          <Link href="/payslips/new" className="mtp-choice"><strong>{choices[0]}</strong><span>{choices[2]}</span></Link>
          <Link href="/demo" className="mtp-choice"><strong>{choices[1]}</strong><span>{choices[3]}</span></Link>
        </div>}
        <div className="mtp-proof"><div><h3 id="mtp-about-title">{about[0]}</h3><p>{about[1]}</p></div></div>
        <div className="mtp-entry-secondary"><Link href="/demo" className="mtp-link">{copy[8]}</Link><Link href="/companies" className="mtp-link">{t("home.exploreCompanies")} →</Link></div>
        <EntryPrivacyNotice />
        
      </div>
    </div>
  </div>;
}


const privacyCopy: Record<Locale, readonly [string, string, string, string]> = {
  de: ["Datenschutz für deine Abrechnungen", "Das Dokument wird auf dem Server verarbeitet. Die von dir geprüften und gespeicherten Beträge werden aufbewahrt. Erfahre, wie deine Daten verwendet werden und wie du sie löschen kannst.", "Testversion: Nur fiktive Dokumente verwenden.", "Datenschutz und Daten"],
  es: ["Privacidad de tus nóminas", "El documento se procesa en el servidor. Las cifras que revises y guardes se conservan. Consulta cómo se usan y cómo puedes eliminar tus datos.", "Versión de prueba: utiliza solo documentos ficticios.", "Privacidad y datos"],
  en: ["Your payslip privacy", "The document is processed on the server. Figures you review and save are retained. Learn how your data is used and how you can delete it.", "Test version: use synthetic documents only.", "Privacy and data"],
  pl: ["Prywatność Twoich pasków płacowych", "Dokument jest przetwarzany na serwerze. Sprawdzone i zapisane kwoty są przechowywane. Dowiedz się, jak dane są wykorzystywane i jak możesz je usunąć.", "Wersja testowa: używaj tylko fikcyjnych dokumentów.", "Prywatność i dane"],
  pt: ["Privacidade dos teus recibos", "O documento é processado no servidor. Os valores que revês e guardas são conservados. Consulta como os teus dados são usados e como os podes eliminar.", "Versão de teste: utiliza apenas documentos fictícios.", "Privacidade e dados"],
  lt: ["Jūsų algalapių privatumas", "Dokumentas apdorojamas serveryje. Patikrintos ir išsaugotos sumos saugomos. Sužinokite, kaip naudojami jūsų duomenys ir kaip juos galite ištrinti.", "Bandomoji versija: naudokite tik išgalvotus dokumentus.", "Privatumas ir duomenys"],
  ro: ["Confidențialitatea fluturașilor tăi", "Documentul este procesat pe server. Sumele pe care le verifici și le salvezi sunt păstrate. Află cum sunt folosite datele tale și cum le poți șterge.", "Versiune de test: folosește doar documente fictive.", "Confidențialitate și date"],
  ru: ["Конфиденциальность расчётных листков", "Документ обрабатывается на сервере. Проверенные и сохранённые суммы хранятся в системе. Узнайте, как используются ваши данные и как их удалить.", "Тестовая версия: используйте только вымышленные документы.", "Конфиденциальность и данные"],
};

function EntryPrivacyNotice() {
  const { locale } = useT();
  const [title, detail, preview, link] = privacyCopy[locale];
  return <aside className="mtp-entry-privacy" aria-labelledby="entry-privacy-title">
    <h3 id="entry-privacy-title">{title}</h3>
    <p>{detail}</p>
    <p>{preview}</p>
    <Link href="/privacy">{link} →</Link>
  </aside>;
}







