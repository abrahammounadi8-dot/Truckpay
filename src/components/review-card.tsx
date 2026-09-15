"use client";
import { useUiCopy } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { equipmentLabels, formatMoney, formatNumber, operationLabels, payTypeLabels } from "@/lib/metrics";
import type { DriverReport } from "@/lib/types";

export function ReviewCard({ review }: { review: DriverReport }) {
  const tr = useUiCopy();
  return (
    <article className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {review.role} · {review.tenure}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{review.submittedAt} · Filed here</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl font-semibold">{formatMoney(review.weeklyPay)}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">take-home / week</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline">{tr(payTypeLabels[review.payType])}</Badge>
        <Badge variant="secondary">{tr(equipmentLabels[review.equipment])}</Badge>
        <Badge variant="outline">{tr(operationLabels[review.operation])}</Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Quoted weekly</dt>
          <dd className="font-medium">
            {review.quotedWeekly != null ? formatMoney(review.quotedWeekly) : tr("Not given")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Hourly (if given)</dt>
          <dd className="font-medium">
            {review.hourlyRate != null ? `${formatMoney(review.hourlyRate)}/hr` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Km / week</dt>
          <dd className="font-medium">
            {review.kmPerWeek != null ? formatNumber(review.kmPerWeek) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{tr("Hours / week")}</dt>
          <dd className="font-medium">{review.hoursPerWeek}</dd>
        </div>
      </dl>
      {review.body ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
      ) : null}
    </article>
  );
}
