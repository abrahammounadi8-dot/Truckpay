"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { frequencyMessageKey } from "@/lib/i18n";
import { formatEuroMaybe, payslipTitle } from "@/lib/payroll/format";
import { REQUIRED_PAYSLIPS, type Payslip } from "@/lib/payroll/types";
import { cn } from "@/lib/utils";

type PublicPayslip = Omit<Payslip, "userId">;

export function PayslipList() {
  const { t } = useT();
  const [slips, setSlips] = useState<PublicPayslip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/payslips", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load"))))
        .then((data: { payslips?: PublicPayslip[] }) => setSlips(data.payslips ?? []))
        .catch(() => setError(t("payslips.loadError")));
    }
    load();
    window.addEventListener("truckpay-payslips-changed", load);
    return () => window.removeEventListener("truckpay-payslips-changed", load);
  }, [t]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (slips == null) {
    return <p className="text-sm text-muted-foreground">{t("payslips.loading")}</p>;
  }
  if (slips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">{t("payslips.emptyTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("payslips.emptyBody")}</p>
        <Link href="/payslips/new" className={cn(buttonVariants(), "mt-5 inline-flex")}>
          {t("nav.addPayslip")}
        </Link>
      </div>
    );
  }

  const towardVerified = Math.min(slips.length, REQUIRED_PAYSLIPS);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("payslips.towardVerified", { have: towardVerified, need: REQUIRED_PAYSLIPS })}
      </p>
      <ul className="space-y-3">
        {slips.map((slip) => (
          <li key={slip.id}>
            <Link
              href={`/payslips/${slip.id}`}
              className="flex flex-col gap-1 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10 hover:ring-foreground/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-heading text-xl font-semibold">{payslipTitle(slip)}</p>
                <p className="text-xs text-muted-foreground">
                  {t(frequencyMessageKey(slip.payFrequency))}
                  {slip.employmentWeeks != null
                    ? ` · ${t("payslips.insurableWeeks", { count: slip.employmentWeeks })}`
                    : ""}
                  {slip.weekAssignment?.weekNumber != null
                    ? ` · ${t("payslips.week", { n: slip.weekAssignment.weekNumber })}${slip.weekAssignment.derived ? ` ${t("payslips.derived")}` : ""}`
                    : ` · ${t("payslips.weekNotAssigned")}`}
                  {slip.reviewStatus === "needs_review" ? ` · ${t("payslips.needsReview")}` : ""}
                </p>
              </div>
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {formatEuroMaybe(slip.netPay ?? slip.grossPay ?? slip.basicPay)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
