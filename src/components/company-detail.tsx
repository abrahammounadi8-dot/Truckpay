"use client";

import Link from "next/link";
import { ReviewCard } from "@/components/review-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { mergeReviews } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import type { DriverReview } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompanyActions({ slug, onDark = false }: { slug: string; onDark?: boolean }) {
  const { toggleCompare, compareSlugs } = useAppStore();
  const selected = compareSlugs.includes(slug);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selected ? "secondary" : "default"}
        className={onDark && !selected ? "bg-accent text-accent-foreground hover:bg-accent/90" : undefined}
        onClick={() => toggleCompare(slug)}
      >
        {selected ? "In compare list" : "Add to compare"}
      </Button>
      <Link
        href={`/report?company=${slug}`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          onDark && "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
        )}
      >
        File a report
      </Link>
    </div>
  );
}

export function CompanyReviews({
  slug,
  seeded,
}: {
  slug: string;
  seeded: DriverReview[];
}) {
  const { reports, ready } = useAppStore();
  const list = mergeReviews(seeded, reports, slug);

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading driver reports…</p>;
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <p className="font-heading text-lg font-semibold">No driver reports yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Be the first to file what actually hit the settlement.</p>
        <Link href={`/report?company=${slug}`} className={cn(buttonVariants(), "mt-4 inline-flex")}>
          File a report
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
