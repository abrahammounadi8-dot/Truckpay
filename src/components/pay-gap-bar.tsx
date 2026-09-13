import { advertisedWeekly, formatMoney, payGapPercent, reportedWeekly } from "@/lib/metrics";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PayGapBar({ company, compact = false }: { company: Company; compact?: boolean }) {
  const advertised = advertisedWeekly(company);
  const reported = reportedWeekly(company);
  const gap = payGapPercent(company);
  const max = Math.max(advertised, reported, 1);
  const worse = gap >= 12;
  const close = gap <= 8;

  return (
    <div className="space-y-2">
      {!compact ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Weekly take-home
          </p>
          <p
            className={cn(
              "font-mono text-xs font-medium tabular-nums",
              worse ? "text-pay-down" : close ? "text-pay-up" : "text-foreground",
            )}
          >
            {gap > 0 ? `${gap}% under the ad` : gap < 0 ? `${Math.abs(gap)}% over the ad` : "Matches the ad"}
          </p>
        </div>
      ) : null}
      <Bar label="Advertised" value={advertised} max={max} tone="ad" />
      <Bar label="Drivers report" value={reported} max={max} tone={worse ? "down" : "up"} />
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
  const width = Math.max(8, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{formatMoney(value)}/wk</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "ad" && "bg-foreground/35",
            tone === "up" && "bg-pay-up",
            tone === "down" && "bg-pay-down",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
