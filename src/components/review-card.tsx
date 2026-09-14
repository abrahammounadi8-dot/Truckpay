import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatCpm, formatMoney } from "@/lib/metrics";
import type { DriverReview } from "@/lib/types";

export function ReviewCard({ review }: { review: DriverReview }) {
  return (
    <article className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-xl font-semibold leading-snug">{review.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {review.nickname} · {review.role} · {review.tenure}
          </p>
        </div>
        <StarRating value={review.rating} />
      </div>
      <p className="mt-4 text-sm leading-7 text-pretty">{review.body}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed border-border pt-3 font-mono text-xs tabular-nums text-muted-foreground">
        {review.cpm != null ? <span>{formatCpm(review.cpm)}</span> : null}
        <span>{formatMoney(review.weeklyPay)}/wk</span>
        <span>{review.milesPerWeek.toLocaleString()} mi/wk</span>
        <span>{review.homeTime}</span>
        <span>{review.date}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {review.wouldRecommend ? (
          <Badge variant="secondary">Would take the job again</Badge>
        ) : (
          <Badge variant="destructive">Would not go back</Badge>
        )}
        {review.pros.map((item) => (
          <Badge key={item} variant="outline">
            + {item}
          </Badge>
        ))}
        {review.cons.map((item) => (
          <Badge key={item} variant="outline">
            − {item}
          </Badge>
        ))}
      </div>
    </article>
  );
}
