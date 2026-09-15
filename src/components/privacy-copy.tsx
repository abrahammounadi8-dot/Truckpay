"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";

export function PrivacyCopy() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {t("privacy.kicker")}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{t("privacy.title")}</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
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
