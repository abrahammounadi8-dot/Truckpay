"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";

export function SiteFooter() {
  const { t } = useT();

  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-heading text-2xl font-semibold tracking-wide">TruckPay</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-primary-foreground/70">{t("footer.tagline")}</p>
        </div>
        <div className="text-sm">
          <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-foreground/50 uppercase">
            {t("footer.myTruckPay")}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/payslips" className="hover:text-primary-foreground">
              {t("footer.privatePayslips")}
            </Link>
            <Link href="/analysis" className="hover:text-primary-foreground">
              {t("footer.payrollAnalysis")}
            </Link>
            <Link href="/profile" className="hover:text-primary-foreground">
              {t("footer.employmentProfile")}
            </Link>
            <Link href="/privacy" className="hover:text-primary-foreground">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-foreground/50 uppercase">
            {t("footer.companies")}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/companies" className="hover:text-primary-foreground">
              {t("footer.directory")}
            </Link>
            <Link href="/rankings" className="hover:text-primary-foreground">
              {t("footer.gaps")}
            </Link>
            <Link href="/compare" className="hover:text-primary-foreground">
              {t("footer.compare")}
            </Link>
            <Link href="/report" className="hover:text-primary-foreground">
              {t("footer.publicSlip")}
            </Link>
            <Link href="/list" className="hover:text-primary-foreground">
              {t("footer.listFirm")}
            </Link>
            <p>{t("footer.laterPhase")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
