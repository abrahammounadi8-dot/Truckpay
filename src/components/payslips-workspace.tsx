"use client";

import Link from "next/link";
import { PayslipList } from "@/components/payslip-list";
import { WipeSession } from "@/components/wipe-session";
import { useT } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PayslipsWorkspace() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {t("payslips.kicker")}
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("payslips.title")}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{t("payslips.lead")}</p>
        </div>
        <Link href="/payslips/new" className={cn(buttonVariants(), "bg-accent text-accent-foreground hover:bg-accent/90")}>
          {t("nav.addPayslip")}
        </Link>
      </div>
      <div className="mt-8">
        <PayslipList />
      </div>
      <p className="mt-6 text-sm">
        <Link href="/analysis" className="underline">
          {t("payslips.openAnalysis")}
        </Link>
        {" · "}
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
