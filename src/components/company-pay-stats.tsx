"use client";

import { useEffect, useState } from "react";
import { formatEuroMaybe } from "@/lib/payroll/format";
import type { CompanyPayStats } from "@/lib/payroll/company-stats";

export function CompanyPayStatsPanel({ slug }: { slug: string }) {
  const [stats, setStats] = useState<CompanyPayStats | null>(null);

  useEffect(() => {
    fetch(`/api/companies/${slug}/stats`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { stats: CompanyPayStats }) => setStats(data.stats))
      .catch(() => setStats(null));
  }, [slug]);

  if (!stats) return null;

  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-xl font-semibold">Observed pay by tenure</h2>
      <p className="mt-2 text-sm text-muted-foreground">{stats.headline}</p>
      <p className="mt-1 text-sm text-muted-foreground">{stats.disclaimer}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {stats.bands.map((band) => (
          <article key={band.band} className="rounded-lg border border-border p-4">
            <p className="font-heading text-lg font-semibold">{band.label}</p>
            {band.published ? (
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Median observed gross / week equiv.</dt>
                  <dd className="font-mono">{formatEuroMaybe(band.medianObservedGrossWeekly)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Median base hourly rate</dt>
                  <dd className="font-mono">{formatEuroMaybe(band.medianBaseHourlyRate)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Median not published.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{band.sampleNote}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
