"use client";

import { consecutiveOnboarding } from "@/lib/payroll/onboarding";
import { AnalysisBoard } from "./analysis-board";
import { PayslipGapNotice } from "./payslip-gap-notice";
import { EmploymentStartField } from "./employment-start-field";
import { PayslipProgress } from "./payslip-progress";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/components/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { frequencyMessageKey } from "@/lib/i18n";
import { formatEuroMaybe } from "@/lib/payroll/format";
import { type Payslip } from "@/lib/payroll/types";
import { groupPayslipsByEmployer, employerNetTotals } from "@/lib/payroll/history";
import { historyCopy } from "@/lib/entry-copy";
import { cn } from "@/lib/utils";

type PublicPayslip = Omit<Payslip, "userId">;

type PayslipResponse = { payslips: PublicPayslip[]; have: number; required: number; readyForAnalysis: boolean };

export function PayslipList({ onHasPayslipsChange, onAccessChange }: { onHasPayslipsChange?: (hasPayslips: boolean) => void; onAccessChange?: (unlocked: boolean) => void }) {
  const { t, locale } = useT();
  const h = historyCopy[locale];
  const [result, setResult] = useState<PayslipResponse | null>(null);
  const slips = result?.payslips;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      fetch("/api/payslips", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load"))))
        .then((data: PayslipResponse) => { setResult(data); setError(null); onHasPayslipsChange?.(data.payslips.length > 0); onAccessChange?.(data.readyForAnalysis); })
        .catch(() => setError(t("payslips.loadError")));
    }
    load();
    window.addEventListener("truckpay-payslips-changed", load);
    window.addEventListener("truckpay-employment-changed", load);
    return () => { window.removeEventListener("truckpay-payslips-changed", load); window.removeEventListener("truckpay-employment-changed", load); };
  }, [t, onHasPayslipsChange, onAccessChange]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (result == null || slips == null) {
    return <p className="text-sm text-muted-foreground">{t("payslips.loading")}</p>;
  }
  if (slips.length === 0) {
    return (
      <div className="space-y-4"><PayslipProgress have={0} required={result.required} unlocked={false} /><div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">{t("payslips.emptyTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("payslips.emptyBody")}</p>
        <Link href="/payslips/new" className={cn(buttonVariants(), "mt-5 inline-flex bg-accent text-accent-foreground hover:bg-accent/90")}>
          {t("nav.addPayslip")}
        </Link>
      </div></div>
    );
  }

  const groups = groupPayslipsByEmployer(slips);
  const { gaps } = consecutiveOnboarding(slips);
  // Explain a gap only when both records rely on the same declared payment cadence.
  const [first, second] = [...slips].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const expected = first.payFrequency === "weekly" ? 7 : first.payFrequency === "fortnightly" ? 14 : null;
  const days = second ? (Date.parse(second.paymentDate) - Date.parse(first.paymentDate)) / 86400000 : NaN;
  const paymentGap = slips.length === 2 && expected && Number.isFinite(days) && days > expected
    && first.payFrequency === second.payFrequency && first.employerSlug && first.employerSlug === second.employerSlug
    && first.countryCode === second.countryCode && first.currency === second.currency
    && !first.payPeriodStart && !first.payPeriodEnd && !second.payPeriodStart && !second.payPeriodEnd
    ? { dates: [first.paymentDate, second.paymentDate], days, expected } : undefined;

  return (
    <div className="space-y-4">
      <PayslipProgress have={result.have} required={result.required} unlocked={result.readyForAnalysis} savedCount={slips.length} paymentGap={paymentGap} needsDetails={slips.length > result.have && !result.readyForAnalysis} />
      <h2 className="font-heading text-2xl font-semibold">{h[0]}</h2>
      {groups.map((group) => (
        <section key={group.key} className="space-y-3 rounded-xl border border-border p-4" aria-label={group.label ?? t("detail.employerMissing")}>
          <h3 className="font-heading text-xl font-semibold">{group.label ?? t("detail.employerMissing")}</h3>
          <p className="text-sm text-muted-foreground">{h[3]}: {group.slips.length} · {group.firstPaymentDate} — {group.lastPaymentDate}</p>
          <div className="rounded-xl bg-accent/10 p-4" aria-live="polite">
            <p className="text-sm font-medium">{locale === "es" ? "Total neto de tus nóminas guardadas" : "Net total of your saved payslips"}</p>
            {employerNetTotals(group.slips).map(total => <div key={total.currency} className="mt-1">
              <p className="font-heading text-3xl font-semibold tabular-nums break-words">{total.amount == null ? "—" : new Intl.NumberFormat(locale, {style:"currency",currency:total.currency}).format(total.amount)}</p>
              {total.missing > 0 && <p className="mt-1 text-sm text-muted-foreground">{locale === "es" ? "Suma incompleta: " + total.missing + " nómina(s) sin importe neto." : "Incomplete total: " + total.missing + " payslip(s) without net pay."}</p>}
            </div>)}
          </div>
          <EmploymentStartField employerName={group.label ?? ""} asOf={group.slips.map(s => s.payPeriodEnd || s.paymentDate).sort().at(-1)} />
          {group.slips[0]?.employerSlug && consecutiveOnboarding(group.slips).unlocked && <AnalysisBoard compact employer={group.slips[0].employerSlug} />}
          <ul className="space-y-3">
        {group.slips.map((slip) => (
          <li key={slip.id}>
            <Link
              href={`/payslips/${slip.id}`}
              className="flex flex-col gap-1 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10 hover:ring-foreground/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                {gaps[slip.id] && <PayslipGapNotice frequency={gaps[slip.id]} />}
                {slip.manualAmountAudit && <p className="text-sm font-semibold text-amber-800">Prueba manual · importes no verificados</p>}
                <p className="font-heading text-xl font-semibold">{t("detail.paid", { date: slip.paymentDate })}</p>
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
        </section>
      ))}
    </div>
  );
}
