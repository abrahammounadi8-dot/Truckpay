"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatEuroMaybe } from "@/lib/payroll/format";
import type { CompanyPayStats } from "@/lib/payroll/company-stats";
import { confidenceRuleText } from "@/lib/payroll/confidence";
import {
  EVIDENCE_LEVEL_LABELS,
  JOB_TYPE_LABELS,
  PAY_CONFIDENCE_LABELS,
  SHIFT_TYPE_LABELS,
  TENURE_BAND_LABELS,
  TIME_FRACTION_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/lib/payroll/types";

export function CompanyPayStatsPanel({ slug }: { slug: string }) {
  const [stats, setStats] = useState<CompanyPayStats | null>(null);

  useEffect(() => {
    fetch(`/api/companies/${slug}/stats`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { stats: CompanyPayStats }) => setStats(data.stats))
      .catch(() => setStats(null));
  }, [slug]);

  if (!stats) return null;

  const publishedSlices = stats.slices.filter((slice) => slice.published);

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-heading text-xl font-semibold">Payroll-verified pay</h2>
        <Badge>{EVIDENCE_LEVEL_LABELS[stats.evidenceLevel]}</Badge>
        <Badge variant="secondary">Confidence {PAY_CONFIDENCE_LABELS[stats.confidence]}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{stats.headline}</p>
      <p className="mt-1 text-sm text-muted-foreground">{stats.disclaimer}</p>
      <p className="mt-1 text-xs text-muted-foreground">{confidenceRuleText(stats.confidence)}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {stats.bands.map((band) => (
          <article key={band.band} className="rounded-lg border border-border p-4">
            <p className="font-heading text-lg font-semibold">{band.label}</p>
            <p className="text-xs text-muted-foreground">
              {EVIDENCE_LEVEL_LABELS[band.evidenceLevel]} · {PAY_CONFIDENCE_LABELS[band.confidence]}
            </p>
            {band.published ? (
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Median base hourly rate</dt>
                  <dd className="font-mono">{formatEuroMaybe(band.medianBaseHourlyRate)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Median gross / week equiv.</dt>
                  <dd className="font-mono">{formatEuroMaybe(band.medianObservedGrossWeekly)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Median paid hours / week equiv.</dt>
                  <dd className="font-mono">
                    {band.medianPaidHoursWeekly != null ? band.medianPaidHoursWeekly : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Median not published.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{band.sampleNote}</p>
          </article>
        ))}
      </div>
      {publishedSlices.length ? (
        <div className="mt-6 space-y-3">
          <h3 className="font-heading text-lg font-semibold">By job, vehicle and shift</h3>
          <p className="text-sm text-muted-foreground">
            Only slices with at least three drivers. Not “the company salary”.
          </p>
          {publishedSlices.map((slice) => (
            <article
              key={`${slice.jobType}-${slice.vehicleType}-${slice.shiftType}-${slice.timeFraction}-${slice.tenureBand}`}
              className="rounded-lg border border-border p-4 text-sm"
            >
              <p className="font-medium">
                {VEHICLE_TYPE_LABELS[slice.vehicleType]} · {SHIFT_TYPE_LABELS[slice.shiftType]} ·{" "}
                {TENURE_BAND_LABELS[slice.tenureBand]}
              </p>
              <p className="text-xs text-muted-foreground">
                {JOB_TYPE_LABELS[slice.jobType]} · {TIME_FRACTION_LABELS[slice.timeFraction]} ·{" "}
                {EVIDENCE_LEVEL_LABELS[slice.evidenceLevel]} · {PAY_CONFIDENCE_LABELS[slice.confidence]}
              </p>
              <dl className="mt-2 grid gap-1 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Median rate</dt>
                  <dd className="font-mono">{formatEuroMaybe(slice.medianBaseHourlyRate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Median gross / week equiv.</dt>
                  <dd className="font-mono">{formatEuroMaybe(slice.medianGrossWeekly)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Median hours / week equiv.</dt>
                  <dd className="font-mono">
                    {slice.medianPaidHoursWeekly != null ? slice.medianPaidHoursWeekly : "—"}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">{slice.sampleNote}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          No job/vehicle/shift slice has three payroll-verified drivers yet, so those medians stay unpublished.
        </p>
      )}
    </section>
  );
}
