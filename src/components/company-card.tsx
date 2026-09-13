"use client";

import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { equipmentLabels, formatCpm, homeTimeLabel, payGapPercent } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompanyCard({ company }: { company: Company }) {
  const { compareSlugs, toggleCompare } = useAppStore();
  const selected = compareSlugs.includes(company.slug);
  const gap = payGapPercent(company);

  return (
    <Card className="h-full bg-card/80">
      <CardHeader className="flex flex-row items-start gap-3">
        <CompanyMark company={company} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/companies/${company.slug}`}
            className="font-heading text-lg font-semibold tracking-tight hover:underline"
          >
            {company.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {company.headquarters} · {company.fleetSize.toLocaleString()} trucks
          </p>
          <div className="mt-1.5">
            <StarRating value={company.reported.rating} />
            <span className="ml-1 text-xs text-muted-foreground">
              {company.reported.reviewCount} reports
            </span>
          </div>
        </div>
        <Badge variant={gap >= 12 ? "destructive" : gap <= 8 ? "secondary" : "outline"}>
          {gap}% gap
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <PayGapBar company={company} />
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-3">
          <Stat label="Advertised CPM" value={formatCpm(company.advertised.cpm)} />
          <Stat label="Reported CPM" value={formatCpm(company.reported.cpm)} />
          <Stat label="Home time" value={homeTimeLabel(company.reported.homeTimeDaysOut)} />
        </dl>
        <div className="flex flex-wrap gap-1">
          {company.equipment.map((item) => (
            <Badge key={item} variant="outline">
              {equipmentLabels[item]}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Link
          href={`/companies/${company.slug}`}
          className={cn(buttonVariants({ size: "sm" }), "flex-1")}
        >
          Open file
        </Link>
        <Button
          size="sm"
          variant={selected ? "secondary" : "outline"}
          onClick={() => toggleCompare(company.slug)}
        >
          {selected ? "In compare" : "Compare"}
        </Button>
      </CardFooter>
    </Card>
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
