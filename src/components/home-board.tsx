"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CompanyCard } from "@/components/company-card";
import { EmptyStub, SettlementStub } from "@/components/settlement-stub";
import { buttonVariants } from "@/components/ui/button";
import { fleet } from "@/lib/data";
import { boardTotals, companyStats, formatMoney } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function HomeBoard() {
  const { reports } = useAppStore();
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
              Ireland · your slip, then the board
            </p>
            <h1 className="mt-4 max-w-xl text-4xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
              Check the payslip. A payment is not one week.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/75">
              Type the figures from an Irish haulage payslip. Truckpay flags arithmetic and unknown deductions without accusing anyone. The public directory is separate — still public facts only, never invented reviews.
            </p>
            <form action="/companies" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <input
                name="q"
                placeholder="Search Nolan, Cork, reefer…"
                className="h-11 rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 px-3 text-sm text-primary-foreground placeholder:text-primary-foreground/45"
              />
              <button
                type="submit"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-accent text-accent-foreground hover:bg-accent/90",
                )}
              >
                Search hauliers
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/payslips/new"
                className={cn(buttonVariants({ size: "lg" }), "bg-accent text-accent-foreground hover:bg-accent/90")}
              >
                Check my pay
              </Link>
              <Link
                href="/report"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                File a public slip
              </Link>
              <Link
                href="/list"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
                )}
              >
                List your firm
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-primary-foreground/12 pt-6">
              <Stat value={String(fleet.length)} label="Hauliers listed" />
              <Stat value={String(totals.slipCount)} label="Wage slips" />
              <Stat
                value={totals.avgGapPercent != null ? `${totals.avgGapPercent}%` : "—"}
                label="Avg. quote gap"
              />
            </div>
          </div>
          <div className="lg:pl-4">
            <p className="mb-3 text-[0.68rem] font-semibold tracking-[0.18em] text-primary-foreground/55 uppercase">
              {worst ? "Widest quote gap on file" : "The board is empty until someone files"}
            </p>
            {worst ? <SettlementStub company={worst.company} stats={worst.stats} /> : <EmptyStub />}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-px px-4 py-0 sm:grid-cols-3 sm:px-0">
          <Mini
            kicker="Widest gap"
            title={worst?.company.shortName ?? "None yet"}
            detail={
              worst?.stats.gapPercent != null
                ? `${worst.stats.gapPercent}% under the quoted weekly`
                : "Needs a slip that includes what they quoted"
            }
            href={worst ? `/companies/${worst.company.slug}` : "/report"}
          />
          <Mini
            kicker="Highest take-home on file"
            title={bestPay?.company.shortName ?? "None yet"}
            detail={
              bestPay?.stats.avgWeekly != null
                ? `${formatMoney(bestPay.stats.avgWeekly)} average from filed slips`
                : "The first Irish slip sets this line"
            }
            href={bestPay ? `/companies/${bestPay.company.slug}` : "/report"}
          />
          <Mini
            kicker="Hauliers"
            title={`${fleet.length} on the board`}
            detail="Public HQ, lanes and fleet notes only — no invented reviews"
            href="/companies"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {featured.length ? "Gaps from filed slips" : "Irish hauliers on the board"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {featured.length
                ? "Sorted by quoted weekly versus take-home, using only slips drivers filed here."
                : "These files show what the firms publish about themselves. Pay appears when drivers file it."}
            </p>
          </div>
          <Link href={featured.length ? "/rankings" : "/companies"} className={cn(buttonVariants({ variant: "outline" }))}>
            {featured.length ? "Full ranking" : "Open directory"}
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {(featured.length ? featured.map((row) => row.company) : fleet.slice(0, 4)).map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
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
