import type { Metadata } from "next";
import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { Badge } from "@/components/ui/badge";
import { fleet } from "@/lib/data";
import { advertisedWeekly, formatMoney, payGapDollars, payGapPercent, reportedWeekly } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Pay gap rankings",
  description: "Trucking companies ranked by how far advertised weekly pay sits above driver-reported take-home.",
};

export default function RankingsPage() {
  const ranked = [...fleet].sort((a, b) => payGapPercent(b) - payGapPercent(a));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Worst first
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Pay gap rankings</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Advertised weekly minus what drivers report. A high number means the
        recruiting pitch is doing more work than the settlement.
      </p>
      <ol className="mt-10 space-y-4">
        {ranked.map((company, index) => {
          const gap = payGapPercent(company);
          const missing = payGapDollars(company);
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
                        {gap}% short
                      </Badge>
                      <span className="font-heading text-lg font-semibold tabular-nums text-pay-down">
                        −{formatMoney(missing)}/wk
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatMoney(advertisedWeekly(company))} ad → {formatMoney(reportedWeekly(company))} real
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:max-w-sm">
                  <PayGapBar company={company} compact />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
