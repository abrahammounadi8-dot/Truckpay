"use client";

import { consecutiveOnboarding } from "@/lib/payroll/onboarding";
import { AnalysisBoard } from "./analysis-board";
import { QuarterlyReview } from "./quarterly-review";
import { PayslipGapNotice } from "./payslip-gap-notice";
import { EmploymentStartField } from "./employment-start-field";
import { PayslipProgress } from "./payslip-progress";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
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

function PersonalPayslipSummary({ slips, companyCount }: { slips: PublicPayslip[]; companyCount: number }) {
  const { locale, t } = useT();
  const es = locale === "es";
  const latest = [...slips].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0];
  const money = (slip: PublicPayslip) => slip.netPay == null ? (es ? "Neto no disponible" : "Net pay unavailable") : new Intl.NumberFormat(locale, { style: "currency", currency: slip.currency }).format(slip.netPay);
  return <section aria-labelledby="personal-summary-title" className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
    <div className="border-b-4 border-accent bg-primary p-5 text-primary-foreground sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{es ? "Tu espacio personal" : "Your personal space"}</p>
      <h2 id="personal-summary-title" className="mt-2 font-heading text-3xl font-semibold">{es ? "Mi resumen" : "My summary"}</h2>
      <p className="mt-2 text-sm text-primary-foreground/80">{es ? "Tu último cobro y tu historial, siempre a mano." : "Your latest payment and history, always at hand."}</p>
    </div>
    <div className="space-y-4 p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/payslips/${latest.id}`} className="rounded-xl bg-accent p-5 text-accent-foreground hover:bg-accent/85">
          <p className="text-sm font-semibold">{es ? "Última nómina · neto" : "Latest payslip · net pay"}</p>
          <p className="mt-2 font-heading text-4xl font-semibold tabular-nums break-words">{money(latest)}</p>
          <p className="mt-3 text-sm">{latest.employerName || t("detail.employerMissing")}</p>
          <p className="mt-1 text-xs">{latest.paymentDate} · {t(frequencyMessageKey(latest.payFrequency))}</p>
          <p className="mt-3 text-sm font-semibold underline">{es ? "Ver esta nómina" : "View this payslip"}</p>
        </Link>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm font-semibold">{es ? "Tu historial guardado" : "Your saved history"}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3"><div><dt className="text-xs text-muted-foreground">{es ? "Nóminas" : "Payslips"}</dt><dd className="mt-1 font-heading text-3xl font-semibold">{slips.length}</dd></div><div><dt className="text-xs text-muted-foreground">{es ? "Empresas en el historial" : "Employers in history"}</dt><dd className="mt-1 font-heading text-3xl font-semibold">{companyCount}</dd></div></dl>
          <a href="#employer-history" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline">{es ? "Ver mi evolución por empresa" : "View my history by employer"}</a>
        </div>
      </div>
      {(latest.manualAmountAudit || latest.reviewStatus === "needs_review") && <p className="rounded-lg border border-accent/50 bg-accent/10 p-3 text-sm">{es ? "La última nómina contiene datos pendientes de revisión o importes manuales. Abre el documento para comprobarlos." : "Your latest payslip has details awaiting review or manual amounts. Open it to check them."}</p>}
      <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6">{es ? "Cuando cobres de nuevo, añade tu siguiente nómina para mantener tu historial al día." : "When you are paid again, add your next payslip to keep your history up to date."}</p><Link href="/payslips/new" className={cn(buttonVariants(), "min-h-12 shrink-0 bg-primary text-primary-foreground")}>{es ? "Añadir siguiente nómina" : "Add next payslip"}</Link></div>
    </div>
  </section>;
}

export function PayslipList({ onHasPayslipsChange, onAccessChange, afterProgress }: { onHasPayslipsChange?: (hasPayslips: boolean) => void; onAccessChange?: (unlocked: boolean) => void; afterProgress?: ReactNode }) {
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
      <div className="space-y-4"><PayslipProgress have={0} required={result.required} unlocked={false} />{afterProgress}<div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center">
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
      <PersonalPayslipSummary slips={slips} companyCount={groups.length} />
      <QuarterlyReview slips={slips} />
      <PayslipProgress have={result.have} required={result.required} unlocked={result.readyForAnalysis} savedCount={slips.length} paymentGap={paymentGap} needsDetails={slips.length > result.have && !result.readyForAnalysis} />
      {afterProgress}
      <h2 id="employer-history" className="scroll-mt-24 font-heading text-2xl font-semibold">{h[0]}</h2>
      {groups.map((group) => (
        <section key={group.key} className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5" aria-label={group.label ?? t("detail.employerMissing")}>
          <h3 className="rounded-xl border-l-4 border-accent bg-primary px-4 py-3 font-heading text-xl font-semibold text-primary-foreground">{group.label ?? t("detail.employerMissing")}</h3>
          <p className="text-sm text-muted-foreground">{h[3]}: {group.slips.length} · {group.firstPaymentDate} — {group.lastPaymentDate}</p>
          <div className="rounded-xl bg-accent/10 p-4" aria-live="polite">
            <p className="text-sm font-medium">{locale === "es" ? "Total neto de tus nóminas guardadas" : "Net total of your saved payslips"}</p>
            {employerNetTotals(group.slips).map(total => <div key={total.currency} className="mt-1">
              <p className="font-heading text-3xl font-semibold tabular-nums break-words">{total.amount == null ? "—" : new Intl.NumberFormat(locale, {style:"currency",currency:total.currency}).format(total.amount)}</p>
              {total.missing > 0 && <p className="mt-1 text-sm text-muted-foreground">{locale === "es" ? "Suma incompleta: " + total.missing + " nómina(s) sin importe neto." : "Incomplete total: " + total.missing + " payslip(s) without net pay."}</p>}
            </div>)}
          </div>
          <details className="rounded-xl border border-border p-4" open>
            <summary className="cursor-pointer font-semibold">{locale === "es" ? "Evolución del neto · últimas 6 nóminas" : "Net pay history · latest 6 payslips"}</summary>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{locale === "es" ? "Importes de cada documento, del más antiguo al más reciente. Las frecuencias, jornadas y períodos pueden variar; no se convierten a un salario mensual." : "Amounts from each document, oldest to newest. Frequency, hours and periods may differ; these are not converted into a monthly salary."}</p>
            <ol className="mt-3 divide-y divide-border">{group.slips.slice(0, 6).reverse().map(slip => <li key={slip.id}><Link href={`/payslips/${slip.id}`} className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-3 hover:text-primary"><span className="text-sm">{slip.paymentDate}<span className="mt-1 block text-xs text-muted-foreground">{t(frequencyMessageKey(slip.payFrequency))}{slip.manualAmountAudit || slip.reviewStatus === "needs_review" ? ` · ${t("payslips.needsReview")}` : ""}</span></span><strong className="font-heading text-xl tabular-nums">{slip.netPay == null ? (locale === "es" ? "Neto no disponible" : "Net pay unavailable") : new Intl.NumberFormat(locale, {style:"currency",currency:slip.currency}).format(slip.netPay)}</strong></Link></li>)}</ol>
          </details>
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
