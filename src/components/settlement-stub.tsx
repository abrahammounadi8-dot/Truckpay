"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import { CompanyMark } from "@/components/company-mark";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney, type CompanyStats } from "@/lib/metrics";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EmptyStub() {
  const { t } = useT();
  return (
    <div className="stub-paper rounded-xl p-5 text-foreground shadow-[0_18px_40px_-24px_rgba(20,28,40,0.55)] ring-1 ring-black/8">
      <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {t("stub.irelandWeekly")}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold">{t("stub.noSlips")}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("stub.noInvent")}</p>
      <div className="mt-5 border-t border-dashed border-foreground/20 pt-4">
        <Link href="/report" className={cn(buttonVariants(), "w-full")}>
          {t("stub.fileFirst")}
        </Link>
      </div>
    </div>
  );
}

export function SettlementStub({ company, stats }: { company: Company; stats: CompanyStats }) {
  const { t } = useT();
  const missing = stats.gapEuro ?? 0;
  const gap = stats.gapPercent ?? 0;

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="stub-paper block rounded-xl p-5 text-foreground shadow-[0_18px_40px_-24px_rgba(20,28,40,0.55)] ring-1 ring-black/8 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CompanyMark company={company} />
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {t("stub.weeklySettlement")}
            </p>
            <p className="font-heading text-2xl leading-none font-semibold">{company.shortName}</p>
          </div>
        </div>
        <span className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
          {stats.count} {stats.count === 1 ? t("stub.slip") : t("stub.slips")}
        </span>
      </div>
      <dl className="mt-5 space-y-2 font-mono text-sm">
        {stats.avgQuoted != null ? (
          <Row label={t("stub.quotedWeekly")} value={formatMoney(stats.avgQuoted)} muted />
        ) : null}
        <Row label={t("stub.driversClear")} value={formatMoney(stats.avgWeekly ?? 0)} />
        {stats.avgQuoted != null ? (
          <>
            <div className="my-3 border-t border-dashed border-foreground/20" />
            <div className="flex items-baseline justify-between gap-3">
              <dt
                className={cn(
                  "text-xs tracking-wide uppercase",
                  missing > 0 ? "text-pay-down" : "text-pay-up",
                )}
              >
                {missing > 0 ? t("stub.shortOfQuote") : missing < 0 ? t("stub.aheadOfQuote") : t("stub.matchesQuote")}
              </dt>
              <dd
                className={cn(
                  "font-heading text-3xl font-semibold tabular-nums",
                  missing > 0 ? "text-pay-down" : "text-pay-up",
                )}
              >
                {formatMoney(Math.abs(missing))}
              </dd>
            </div>
            <p className="pt-1 text-right text-xs text-muted-foreground">
              {missing === 0
                ? t("stub.fromFiled")
                : missing > 0
                  ? t("stub.underQuote", { percent: Math.abs(gap) })
                  : t("stub.overQuote", { percent: Math.abs(gap) })}
            </p>
          </>
        ) : (
          <p className="pt-2 text-xs text-muted-foreground">{t("stub.averageOnly")}</p>
        )}
      </dl>
    </Link>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", muted && "text-muted-foreground line-through decoration-foreground/30")}>
        {value}
      </dd>
    </div>
  );
}
