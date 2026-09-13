import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCpm, formatMoney } from "@/lib/metrics";
import type { DriverReview } from "@/lib/types";

export function ReviewCard({ review }: { review: DriverReview }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium">{review.title}</p>
            <p className="text-xs text-muted-foreground">
              {review.nickname} · {review.role} · {review.tenure}
            </p>
          </div>
          <StarRating value={review.rating} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-pretty">{review.body}</p>
        <div className="flex flex-wrap gap-3 font-mono text-xs tabular-nums text-muted-foreground">
          {review.cpm != null ? <span>{formatCpm(review.cpm)}</span> : null}
          <span>{formatMoney(review.weeklyPay)}/wk</span>
          <span>{review.milesPerWeek.toLocaleString()} mi/wk</span>
          <span>{review.homeTime}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
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
        <p className="text-xs text-muted-foreground">{review.date}</p>
      </CardContent>
    </Card>
  );
}
