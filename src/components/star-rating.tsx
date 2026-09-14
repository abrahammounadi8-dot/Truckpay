import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "sm",
  inverted = false,
}: {
  value: number;
  size?: "sm" | "md";
  inverted?: boolean;
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
            <span className={cn("absolute inset-0", inverted ? "text-white/25" : "text-muted-foreground/35")}>★</span>
            <span
              className={cn("absolute inset-0 overflow-hidden", inverted ? "text-accent" : "text-amber-700")}
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
      <span
        className={cn(
          "ml-1 font-mono text-xs tabular-nums",
          inverted ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {value.toFixed(1)}
      </span>
    </span>
  );
}

