"use client";

import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { companyStats, equipmentLabels, operationLabels } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompanyCard({ company }: { company: Company }) {
  const { compareSlugs, toggleCompare, reports } = useAppStore();
  const selected = compareSlugs.includes(company.slug);
  const stats = companyStats(company.slug, reports);

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
          <p className="text-xs text-muted-foreground">{company.headquarters}</p>
          {stats.count > 0 ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {stats.count} wage {stats.count === 1 ? "slip" : "slips"} on file
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">Awaiting the first wage slip</p>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4">
        <p className="text-sm leading-6 text-muted-foreground">{company.summary}</p>
        <PayGapBar stats={stats} />
        <div className="flex flex-wrap gap-1 border-t border-dashed border-border pt-3">
          {company.equipment.map((item) => (
            <Badge key={item} variant="outline">
              {equipmentLabels[item]}
            </Badge>
          ))}
          {company.operations.map((item) => (
            <Badge key={item} variant="secondary">
              {operationLabels[item]}
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
