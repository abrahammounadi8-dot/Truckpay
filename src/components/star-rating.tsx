import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {stars.map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)));
        return (
          <span
            key={star}
            className={cn("relative inline-block", size === "md" ? "h-4 w-4" : "h-3.5 w-3.5")}
          >
            <span className="absolute inset-0 text-muted-foreground/35">★</span>
            <span
              className="absolute inset-0 overflow-hidden text-amber-600"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
      <span className="ml-1 font-mono text-xs tabular-nums text-muted-foreground">
        {value.toFixed(1)}
      </span>
    </span>
  );
}
