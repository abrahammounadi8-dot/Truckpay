"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { fleet } from "@/lib/data";
import {
  advertisedWeekly,
  formatCpm,
  formatMoney,
  homeTimeLabel,
  payGapPercent,
  reportedWeekly,
} from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const rows: { label: string; render: (slug: string) => React.ReactNode }[] = [
  {
    label: "Advertised weekly",
    render: (slug) => {
      const company = fleet.find((item) => item.slug === slug)!;
      return formatMoney(advertisedWeekly(company));
    },
  },
  {
    label: "Reported weekly",
    render: (slug) => {
      const company = fleet.find((item) => item.slug === slug)!;
      return formatMoney(reportedWeekly(company));
    },
  },
  {
    label: "Pay gap",
    render: (slug) => {
      const company = fleet.find((item) => item.slug === slug)!;
      return `${payGapPercent(company)}%`;
    },
  },
  {
    label: "Advertised CPM",
    render: (slug) => formatCpm(fleet.find((item) => item.slug === slug)!.advertised.cpm),
  },
  {
    label: "Reported CPM",
    render: (slug) => formatCpm(fleet.find((item) => item.slug === slug)!.reported.cpm),
  },
  {
    label: "Home time",
    render: (slug) => homeTimeLabel(fleet.find((item) => item.slug === slug)!.reported.homeTimeDaysOut),
  },
  {
    label: "Hours / week",
    render: (slug) => `${fleet.find((item) => item.slug === slug)!.conditions.averageHours}h`,
  },
  {
    label: "Detention paid",
    render: (slug) => yesNo(fleet.find((item) => item.slug === slug)!.conditions.detentionPaid),
  },
  {
    label: "Forced dispatch",
    render: (slug) => yesNo(fleet.find((item) => item.slug === slug)!.conditions.forcedDispatch),
  },
  {
    label: "Orientation paid",
    render: (slug) => yesNo(fleet.find((item) => item.slug === slug)!.conditions.orientationPaid),
  },
  {
    label: "Slip seating",
    render: (slug) => yesNo(fleet.find((item) => item.slug === slug)!.conditions.slipSeating),
  },
  {
    label: "Pets",
    render: (slug) => yesNo(fleet.find((item) => item.slug === slug)!.conditions.petFriendly),
  },
];

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function CompareTable({ ids }: { ids: string[] }) {
  const { compareSlugs, toggleCompare } = useAppStore();
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
          Open a company file and tap Compare — up to three carriers.
        </p>
        <Link href="/companies" className={cn(buttonVariants(), "mt-5 inline-flex")}>
          Browse companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {selected.map((company) => (
          <div key={company.slug} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <CompanyMark company={company} />
              <div>
                <Link href={`/companies/${company.slug}`} className="font-heading font-semibold hover:underline">
                  {company.shortName}
                </Link>
                <StarRating value={company.reported.rating} />
              </div>
            </div>
            <div className="mt-4">
              <PayGapBar company={company} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {company.equipment.map((item) => (
                <Badge key={item} variant="outline">
                  {item}
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
        ))}
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
                  <td key={company.slug} className="px-4 py-2.5 font-mono tabular-nums">
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
