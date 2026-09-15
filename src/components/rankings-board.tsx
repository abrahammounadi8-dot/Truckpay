"use client";
import { useUiCopy } from "@/components/language-provider";

import Link from "next/link";
import { useMemo } from "react";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { fleet } from "@/lib/data";
import { companyStats, formatMoney } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function RankingsBoard() {
  const tr = useUiCopy();
  const { reports } = useAppStore();
  const ranked = useMemo(() => {
    return [...fleet]
      .map((company) => ({ company, stats: companyStats(company.slug, reports) }))
      .filter((row) => row.stats.gapPercent != null)
      .sort((a, b) => (b.stats.gapPercent ?? 0) - (a.stats.gapPercent ?? 0));
  }, [reports]);

  if (ranked.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">{tr("No quote gaps to rank yet")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{tr("A ranking needs a wage slip that includes both take-home and what the firm quoted. That is driver-reported evidence. TruckPay will not invent either number.")}</p>
        <Link href="/report" className={cn(buttonVariants(), "mt-5 inline-flex")}>{tr("File a wage slip")}</Link>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {ranked.map(({ company, stats }, index) => {
        const gap = stats.gapPercent ?? 0;
        const missing = stats.gapEuro ?? 0;
        return (
          <li key={company.slug} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-start gap-4">
                <span className="font-heading w-10 text-3xl font-semibold text-muted-foreground/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <CompanyMark company={company} />
                <div>
                  <Link href={`/companies/${company.slug}`} className="font-heading text-2xl font-semibold hover:underline">
                    {company.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{company.headquarters}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={gap >= 20 ? "destructive" : gap <= 8 ? "secondary" : "outline"}>
                      {tr("{n}% short", { n: gap })}
                    </Badge>
                    <span className="font-heading text-lg font-semibold tabular-nums text-pay-down">
                      −{formatMoney(missing)}{tr("/wk")}</span>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {stats.avgQuoted != null ? formatMoney(stats.avgQuoted) : "—"} {tr("Quoted")} →{" "}
                      {stats.avgWeekly != null ? formatMoney(stats.avgWeekly) : "—"} {tr("Cleared")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full lg:max-w-sm">
                <PayGapBar stats={stats} compact />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
