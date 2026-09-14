"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { fleet } from "@/lib/data";
import { companyStats, equipmentLabels, formatMoney, operationLabels } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CompareTable({ ids }: { ids: string[] }) {
  const { compareSlugs, toggleCompare, reports } = useAppStore();
  const slugs = useMemo(() => {
    const fromQuery = ids.filter((id) => fleet.some((company) => company.slug === id));
    if (fromQuery.length) return fromQuery.slice(0, 3);
    return compareSlugs;
  }, [ids, compareSlugs]);

  const selected = slugs
    .map((slug) => fleet.find((company) => company.slug === slug))
    .filter((company) => company != null);

  if (selected.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">Nothing on the board yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Open a company file and tap Compare — up to three Irish hauliers.
        </p>
        <Link href="/companies" className={cn(buttonVariants(), "mt-5 inline-flex")}>
          Browse hauliers
        </Link>
      </div>
    );
  }

  const rows: { label: string; render: (slug: string) => React.ReactNode }[] = [
    {
      label: "Headquarters",
      render: (slug) => fleet.find((item) => item.slug === slug)!.headquarters,
    },
    {
      label: "County",
      render: (slug) => fleet.find((item) => item.slug === slug)!.county,
    },
    {
      label: "Equipment",
      render: (slug) =>
        fleet
          .find((item) => item.slug === slug)!
          .equipment.map((item) => equipmentLabels[item])
          .join(", "),
    },
    {
      label: "Lanes",
      render: (slug) =>
        fleet
          .find((item) => item.slug === slug)!
          .operations.map((item) => operationLabels[item])
          .join(", "),
    },
    {
      label: "Fleet notes",
      render: (slug) => fleet.find((item) => item.slug === slug)!.fleetNote ?? "Not stated publicly",
    },
    {
      label: "Wage slips",
      render: (slug) => {
        const stats = companyStats(slug, reports);
        return stats.count ? String(stats.count) : "None yet";
      },
    },
    {
      label: "Take-home / week",
      render: (slug) => {
        const stats = companyStats(slug, reports);
        return stats.avgWeekly != null ? formatMoney(stats.avgWeekly) : "No slips";
      },
    },
    {
      label: "Quoted / week",
      render: (slug) => {
        const stats = companyStats(slug, reports);
        return stats.avgQuoted != null ? formatMoney(stats.avgQuoted) : "Not given";
      },
    },
    {
      label: "Quote gap",
      render: (slug) => {
        const stats = companyStats(slug, reports);
        return stats.gapPercent != null ? `${stats.gapPercent}%` : "—";
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {selected.map((company) => {
          const stats = companyStats(company.slug, reports);
          return (
            <div key={company.slug} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <CompanyMark company={company} />
                <div>
                  <Link href={`/companies/${company.slug}`} className="font-heading font-semibold hover:underline">
                    {company.shortName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{company.headquarters}</p>
                </div>
              </div>
              <div className="mt-4">
                <PayGapBar stats={stats} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {company.equipment.map((item) => (
                  <Badge key={item} variant="outline">
                    {equipmentLabels[item]}
                  </Badge>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 text-xs text-muted-foreground underline"
                onClick={() => toggleCompare(company.slug)}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Line</th>
              {selected.map((company) => (
                <th key={company.slug} className="px-4 py-3 font-heading">
                  {company.shortName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/70 last:border-0">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">{row.label}</th>
                {selected.map((company) => (
                  <td key={company.slug} className="px-4 py-2.5 font-mono text-xs tabular-nums sm:text-sm">
                    {row.render(company.slug)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
