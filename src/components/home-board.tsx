"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useT } from "@/components/language-provider";
import { CompanyCard } from "@/components/company-card";
import { EmptyStub, SettlementStub } from "@/components/settlement-stub";
import { buttonVariants } from "@/components/ui/button";
import { fleet } from "@/lib/data";
import { boardTotals, companyStats, formatMoney } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function HomeBoard() {
  const { reports } = useAppStore();
  const { t } = useT();
  const totals = boardTotals(reports);

  const ranked = useMemo(() => {
    return [...fleet]
      .map((company) => ({ company, stats: companyStats(company.slug, reports) }))
      .filter((row) => row.stats.count > 0);
  }, [reports]);

  const worst = [...ranked]
    .filter((row) => row.stats.gapPercent != null)
    .sort((a, b) => (b.stats.gapPercent ?? 0) - (a.stats.gapPercent ?? 0))[0];
  const bestPay = [...ranked].sort((a, b) => (b.stats.avgWeekly ?? 0) - (a.stats.avgWeekly ?? 0))[0];
  const featured = [...ranked]
    .sort((a, b) => (b.stats.gapPercent ?? -Infinity) - (a.stats.gapPercent ?? -Infinity))
    .slice(0, 4);

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent uppercase">
              {t("home.kicker")}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
              {t("home.headline")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/75">{t("home.lead")}</p>
            <form action="/companies" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                name="q"
                placeholder={t("home.searchPlaceholder")}
                className="h-11 rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-3 text-sm text-primary-foreground placeholder:text-primary-foreground/45"
              />
              <button
                type="submit"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-accent text-accent-foreground hover:bg-accent/90",
                )}
              >
                {t("home.searchCompanies")}
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/payslips/new"
                className={cn(buttonVariants({ size: "lg" }), "bg-accent text-accent-foreground hover:bg-accent/90")}
              >
                {t("home.addPayslip")}
              </Link>
              <Link
                href="/companies"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                {t("home.exploreCompanies")}
              </Link>
              <Link
                href="/report"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                {t("home.publicSlip")}
              </Link>
              <Link
                href="/list"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                {t("home.listFirm")}
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-primary-foreground/12 pt-6">
              <Stat value={String(fleet.length)} label={t("home.hauliersListed")} />
              <Stat value={String(totals.slipCount)} label={t("home.driverStubs")} />
              <Stat
                value={totals.avgGapPercent != null ? `${totals.avgGapPercent}%` : "—"}
                label={t("home.avgGap")}
              />
            </div>
          </div>
          <div className="lg:pl-4">
            <p className="mb-3 text-[0.68rem] font-semibold tracking-[0.18em] text-primary-foreground/55 uppercase">
              {worst ? t("home.widestGapOnFile") : t("home.boardEmpty")}
            </p>
            {worst ? <SettlementStub company={worst.company} stats={worst.stats} /> : <EmptyStub />}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-px px-4 py-0 sm:grid-cols-3 sm:px-0">
          <Mini
            kicker={t("home.widestGap")}
            title={worst?.company.shortName ?? t("home.noneYet")}
            detail={
              worst?.stats.gapPercent != null
                ? t("home.underQuoted", { percent: worst.stats.gapPercent })
                : t("home.needsQuotedSlip")
            }
            href={worst ? `/companies/${worst.company.slug}` : "/report"}
          />
          <Mini
            kicker={t("home.highestTakeHome")}
            title={bestPay?.company.shortName ?? t("home.noneYet")}
            detail={
              bestPay?.stats.avgWeekly != null
                ? t("home.avgFiled", { amount: formatMoney(bestPay.stats.avgWeekly) })
                : t("home.firstSlipSets")
            }
            href={bestPay ? `/companies/${bestPay.company.slug}` : "/report"}
          />
          <Mini
            kicker={t("home.hauliers")}
            title={t("home.onTheBoard", { count: fleet.length })}
            detail={t("home.publicHqOnly")}
            href="/companies"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {featured.length ? t("home.gapsTitle") : t("home.hauliersTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {featured.length ? t("home.gapsDetail") : t("home.hauliersDetail")}
            </p>
          </div>
          <Link href={featured.length ? "/rankings" : "/companies"} className={cn(buttonVariants({ variant: "outline" }))}>
            {featured.length ? t("home.fullRanking") : t("home.openDirectory")}
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {(featured.length ? featured.map((row) => row.company) : fleet.slice(0, 4)).map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
          <Step n="01" title={t("home.step1Title")} body={t("home.step1Body")} />
          <Step n="02" title={t("home.step2Title")} body={t("home.step2Body")} />
          <Step n="03" title={t("home.step3Title")} body={t("home.step3Body")} />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-14 sm:flex-row">
          <Link
            href="/payslips/new"
            className={cn(buttonVariants({ size: "lg" }), "bg-accent text-accent-foreground hover:bg-accent/90")}
          >
            {t("home.checkPayslip")}
          </Link>
          <Link
            href="/report"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
            )}
          >
            {t("home.publicSlip")}
          </Link>
          <Link
            href="/list"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
            )}
          >
            {t("home.listFirm")}
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs tracking-wide text-primary-foreground/55 uppercase">{label}</p>
    </div>
  );
}

function Mini({
  kicker,
  title,
  detail,
  href,
}: {
  kicker: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="px-4 py-6 transition-colors hover:bg-muted/70 sm:px-8">
      <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{kicker}</p>
      <p className="mt-1 font-heading text-2xl font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </Link>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-accent">{n}</p>
      <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-primary-foreground/70">{body}</p>
    </div>
  );
}
