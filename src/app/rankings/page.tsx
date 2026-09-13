import type { Metadata } from "next";
import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { Badge } from "@/components/ui/badge";
import { fleet } from "@/lib/data";
import { advertisedWeekly, formatMoney, payGapPercent, reportedWeekly } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Pay gap rankings",
  description: "Trucking companies ranked by how far advertised weekly pay sits above driver-reported take-home.",
};

export default function RankingsPage() {
  const ranked = [...fleet].sort((a, b) => payGapPercent(b) - payGapPercent(a));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pay gap rankings</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Gap is advertised weekly minus what drivers report, as a percent of the ad.
        A high number means the recruiting pitch is doing more work than the settlement.
      </p>
      <ol className="mt-8 space-y-3">
        {ranked.map((company, index) => {
          const gap = payGapPercent(company);
          return (
            <li
              key={company.slug}
              className="rounded-xl border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex flex-1 items-start gap-3">
                  <span className="font-heading w-8 text-2xl font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <CompanyMark company={company} />
                  <div>
                    <Link href={`/companies/${company.slug}`} className="font-heading text-xl font-semibold hover:underline">
                      {company.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{company.headquarters}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant={gap >= 20 ? "destructive" : gap <= 8 ? "secondary" : "outline"}>
                        {gap}% under the ad
                      </Badge>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatMoney(advertisedWeekly(company))} advertised → {formatMoney(reportedWeekly(company))} reported
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
