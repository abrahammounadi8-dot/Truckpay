"use client";
import { useUiCopy } from "@/components/language-provider";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PayGapBar } from "@/components/pay-gap-bar";
import { ReviewCard } from "@/components/review-card";
import { EmptyStub, SettlementStub } from "@/components/settlement-stub";
import { CompanyPayStatsPanel } from "@/components/company-pay-stats";
import { useAppStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import type { CompanyPayStats } from "@/lib/payroll/company-stats";
import { companyStats, equipmentLabels, operationLabels, reportsFor } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export function CompanyDetail({
  company,
  payStats,
}: {
  company: Company;
  payStats: CompanyPayStats;
}) {
  const tr = useUiCopy();
  const { reports, compareSlugs, toggleCompare } = useAppStore();
  const stats = useMemo(() => companyStats(company.slug, reports), [company.slug, reports]);
  const slips = useMemo(() => reportsFor(reports, company.slug), [reports, company.slug]);
  const selected = compareSlugs.includes(company.slug);

  return (
    <div>
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link
            href="/companies"
            className="inline-flex items-center gap-1.5 text-xs tracking-wide text-primary-foreground/55 uppercase hover:text-primary-foreground"
          >
            <ArrowLeft className="size-3.5" />{tr("Directory")}</Link>
          <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-accent uppercase">
                {company.county}
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{company.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/70">
                {company.summary}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-primary-foreground/65">
                <MapPin className="size-4" />
                {company.headquarters}
                {company.founded ? <span>· {tr("Founded: {year}", { year: company.founded })}</span> : null}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary-foreground"
                  >{tr("Company site")}<ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>
            {stats.count > 0 && stats.avgWeekly != null ? (
              <div className="max-w-xs rounded-lg border border-primary-foreground/15 bg-primary-foreground/8 p-4 text-left lg:text-right">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">{tr("Driver reported")}</p>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  {tr("{n} public reports. These do not establish what {company} pays.", { n: stats.count, company: company.shortName })}
                </p>
              </div>
            ) : (
              <div className="max-w-xs rounded-lg border border-primary-foreground/15 bg-primary-foreground/8 p-4 text-sm text-primary-foreground/75 lg:text-right">{tr("No take-home figures yet. TruckPay will not invent them. Driver-reported stubs and payroll-verified medians are kept separate.")}</div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/report?company=${company.slug}`}
              className={cn(buttonVariants({ size: "sm" }), "bg-accent text-accent-foreground hover:bg-accent/90")}
            >{tr("File a wage slip")}</Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toggleCompare(company.slug)}
            >
              {selected ? tr("In compare") : tr("Compare")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {company.equipment.map((item) => (
            <Badge key={item} variant="secondary">
              {tr(equipmentLabels[item])}
            </Badge>
          ))}
          {company.operations.map((item) => (
            <Badge key={item} variant="outline">
              {tr(operationLabels[item])}
            </Badge>
          ))}
        </div>

        {stats.count > 0 ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold">{tr("Driver-reported stubs")}</h2>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{tr("Driver reported")}</span>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">{tr("Voluntary community slips. Not the same evidence as payroll-verified medians from My TruckPay. Averages here are not “the company salary”.")}</p>
            <SettlementStub company={company} stats={stats} />
          </section>
        ) : (
          <EmptyStub />
        )}

        <section className="space-y-3">
          <h2 className="font-heading text-2xl font-semibold">{tr("Quoted vs take-home")}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{tr("The quoted column is only filled when a driver also reported what the firm told them they would earn. Truckpay does not invent that number.")}</p>
          <PayGapBar stats={stats} />
        </section>

        <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-heading text-xl font-semibold">{tr("Public facts")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Taken from the operator’s own site. Not a review.")}</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Fact label={tr("Headquarters")} value={company.headquarters} />
            <Fact
              label={tr("Fleet notes")}
              value={company.fleetNote ?? tr("Not stated publicly")}
            />
            <Fact
              label={tr("Typical work")}
              value={company.operations.map((item) => tr(operationLabels[item])).join(" · ")}
            />
            <Fact
              label={tr("Equipment")}
              value={company.equipment.map((item) => tr(equipmentLabels[item])).join(" · ")}
            />
          </dl>
        </section>

        <CompanyPayStatsPanel stats={payStats} />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-semibold">{tr("Driver-reported wage slips")}</h2>
              <p className="text-sm text-muted-foreground">{tr("Public stubs only. Private My TruckPay payslips never appear here.")}</p>
            </div>
            <Link href={`/report?company=${company.slug}`} className={cn(buttonVariants())}>{tr("File a wage slip")}</Link>
          </div>
          {slips.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
              <p className="font-heading text-lg font-semibold">{tr("No slips on file")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr("If you drive for {company}, your first report is the one others will see.", { company: company.name })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slips.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
