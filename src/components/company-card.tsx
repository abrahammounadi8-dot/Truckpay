"use client";

import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { equipmentLabels, formatCpm, homeTimeLabel, payGapPercent } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompanyCard({ company }: { company: Company }) {
  const { compareSlugs, toggleCompare } = useAppStore();
  const selected = compareSlugs.includes(company.slug);
  const gap = payGapPercent(company);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-start gap-3 px-5 pt-5">
        <CompanyMark company={company} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/companies/${company.slug}`}
            className="font-heading text-xl font-semibold tracking-tight hover:underline"
          >
            {company.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {company.headquarters} · {company.fleetSize.toLocaleString()} trucks
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StarRating value={company.reported.rating} />
            <span className="text-xs text-muted-foreground">{company.reported.reviewCount} reports</span>
          </div>
        </div>
        <Badge variant={gap >= 12 ? "destructive" : gap <= 8 ? "secondary" : "outline"}>
          {gap}% short
        </Badge>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4">
        <PayGapBar company={company} />
        <dl className="grid grid-cols-3 gap-2 border-t border-dashed border-border pt-3 text-xs">
          <Stat label="Ad CPM" value={formatCpm(company.advertised.cpm)} />
          <Stat label="Real CPM" value={formatCpm(company.reported.cpm)} />
          <Stat label="Home" value={homeTimeLabel(company.reported.homeTimeDaysOut)} />
        </dl>
        <div className="flex flex-wrap gap-1">
          {company.equipment.map((item) => (
            <Badge key={item} variant="outline">
              {equipmentLabels[item]}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-2 border-t border-border bg-muted/40 px-5 py-3">
        <Link href={`/companies/${company.slug}`} className={cn(buttonVariants({ size: "sm" }), "flex-1")}>
          Open file
        </Link>
        <Button size="sm" variant={selected ? "secondary" : "outline"} onClick={() => toggleCompare(company.slug)}>
          {selected ? "In compare" : "Compare"}
        </Button>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm tabular-nums">{value}</dd>
    </div>
  );
}
