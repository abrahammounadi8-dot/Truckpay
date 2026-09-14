import { advertisedWeekly, formatMoney, payGapDollars, payGapPercent, reportedWeekly } from "@/lib/metrics";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PayGapBar({ company, compact = false }: { company: Company; compact?: boolean }) {
  const advertised = advertisedWeekly(company);
  const reported = reportedWeekly(company);
  const gap = payGapPercent(company);
  const dollars = payGapDollars(company);
  const max = Math.max(advertised, reported, 1);
  const worse = gap >= 12;
  const close = gap <= 8;

  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Missing vs the ad
            </p>
            <p
              className={cn(
                "font-heading text-3xl leading-none font-semibold tabular-nums",
                worse ? "text-pay-down" : close ? "text-pay-up" : "text-foreground",
              )}
            >
              {dollars > 0 ? `−${formatMoney(dollars)}` : dollars < 0 ? `+${formatMoney(Math.abs(dollars))}` : formatMoney(0)}
              <span className="ml-1.5 text-base font-medium text-muted-foreground">/wk</span>
            </p>
          </div>
          <p
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-xs font-medium tabular-nums",
              worse ? "bg-pay-down/10 text-pay-down" : close ? "bg-pay-up/10 text-pay-up" : "bg-muted text-foreground",
            )}
          >
            {gap > 0 ? `${gap}% short` : gap < 0 ? `${Math.abs(gap)}% over` : "matches ad"}
          </p>
        </div>
      ) : null}
      <Bar label="Billboard" value={advertised} max={max} tone="ad" />
      <Bar label="Settlement" value={reported} max={max} tone={worse ? "down" : "up"} />
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
