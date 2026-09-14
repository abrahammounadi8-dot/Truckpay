import type { CompanyStats } from "@/lib/metrics";
import { formatMoney } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export function PayGapBar({ stats, compact = false }: { stats: CompanyStats; compact?: boolean }) {
  if (stats.count === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No driver settlements on file yet. The first wage slip sets the board.
      </p>
    );
  }

  const advertised = stats.avgQuoted ?? 0;
  const reported = stats.avgWeekly ?? 0;
  const max = Math.max(advertised, reported, 1);
  const gap = stats.gapPercent;
  const euros = stats.gapEuro;
  const worse = (gap ?? 0) >= 12;
  const close = gap != null && gap <= 8;
  const hasQuote = stats.avgQuoted != null;

  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {hasQuote ? "Missing vs the quote" : "Average take-home"}
            </p>
            <p
              className={cn(
                "font-heading text-3xl leading-none font-semibold tabular-nums",
                hasQuote ? (worse ? "text-pay-down" : close ? "text-pay-up" : "text-foreground") : "text-foreground",
              )}
            >
              {hasQuote && euros != null
                ? euros > 0
                  ? `−${formatMoney(euros)}`
                  : euros < 0
                    ? `+${formatMoney(Math.abs(euros))}`
                    : formatMoney(0)
                : formatMoney(reported)}
              <span className="ml-1.5 text-base font-medium text-muted-foreground">/wk</span>
            </p>
          </div>
          <p className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs tabular-nums">
            {stats.count} {stats.count === 1 ? "slip" : "slips"}
            {gap != null ? ` · ${gap}%` : ""}
          </p>
        </div>
      ) : null}
      {hasQuote ? <Bar label="Quoted" value={advertised} max={max} tone="ad" /> : null}
      <Bar label="Cleared" value={reported} max={max} tone={hasQuote && worse ? "down" : "up"} />
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "ad" | "up" | "down";
}) {
  const width = Math.max(10, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{formatMoney(value)}/wk</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "ad" && "bg-foreground/30",
            tone === "up" && "bg-pay-up",
            tone === "down" && "bg-pay-down",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
