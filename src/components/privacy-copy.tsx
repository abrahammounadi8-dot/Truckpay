"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import type { Locale } from "@/lib/i18n";

const contactLabels: Record<Locale, { controller: string; contact: string }> = {
  en: { controller: "Data controller", contact: "Privacy contact" },
  es: { controller: "Responsable del tratamiento", contact: "Contacto de privacidad" },
  ro: { controller: "Operator de date", contact: "Contact pentru confidențialitate" },
  pl: { controller: "Administrator danych", contact: "Kontakt w sprawach prywatności" },
  pt: { controller: "Responsável pelo tratamento", contact: "Contacto de privacidade" },
  lt: { controller: "Duomenų valdytojas", contact: "Kontaktas privatumo klausimais" },
  ru: { controller: "Оператор персональных данных", contact: "Контакт по вопросам конфиденциальности" },
};

export function PrivacyCopy() {
  const { t, locale } = useT();
  const labels = contactLabels[locale];
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {t("privacy.kicker")}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{t("privacy.title")}</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <dl className="space-y-2 rounded-lg border border-border p-4">
          <div>
            <dt className="font-medium text-foreground">{labels.controller}</dt>
            <dd>Ibrahim Mounadi Boujanna</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">{labels.contact}</dt>
            <dd><a className="break-all underline underline-offset-4" href="mailto:privacy@mytruckpay.com">privacy@mytruckpay.com</a></dd>
          </div>
        </dl>
        <p>{t("privacy.p1")}</p>
        <p>{t("privacy.p2")}</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{t("privacy.l1")}</li>
          <li>{t("privacy.l2")}</li>
          <li>{t("privacy.l3")}</li>
          <li>{t("privacy.l4")}</li>
          <li>{t("privacy.l5")}</li>
        </ol>
        <p>{t("privacy.p3")}</p>
        <p>{t("privacy.p4")}</p>
        <p>{t("privacy.p5")}</p>
        <p>{t("privacy.p6")}</p>
      </div>
      <Link href="/payslips" className="mt-8 inline-block text-sm font-medium underline">
        {t("privacy.openWorkspace")}
      </Link>
    </div>
  );
}
