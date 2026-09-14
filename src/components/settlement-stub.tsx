import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney, type CompanyStats } from "@/lib/metrics";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EmptyStub() {
  return (
    <div className="stub-paper rounded-xl p-5 text-foreground shadow-[0_18px_40px_-24px_rgba(20,28,40,0.55)] ring-1 ring-black/8">
      <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Ireland · weekly settlement
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold">No slips on the board yet</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Truckpay does not invent reviews or take-home figures. The first Irish
        driver to file a real wage slip opens this board.
      </p>
      <div className="mt-5 border-t border-dashed border-foreground/20 pt-4">
        <Link href="/report" className={cn(buttonVariants(), "w-full")}>
          File the first slip
        </Link>
      </div>
    </div>
  );
}

export function SettlementStub({ company, stats }: { company: Company; stats: CompanyStats }) {
  const missing = stats.gapEuro ?? 0;
  const gap = stats.gapPercent ?? 0;

  return (
    <Link
      href={`/companies/${company.slug}`}
      className="stub-paper block rounded-xl p-5 text-foreground shadow-[0_18px_40px_-24px_rgba(20,28,40,0.55)] ring-1 ring-black/8 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CompanyMark company={company} />
          <div>
            <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Weekly settlement
            </p>
            <p className="font-heading text-2xl leading-none font-semibold">{company.shortName}</p>
          </div>
        </div>
        <span className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
          {stats.count} {stats.count === 1 ? "slip" : "slips"}
        </span>
      </div>
      <dl className="mt-5 space-y-2 font-mono text-sm">
        {stats.avgQuoted != null ? (
          <Row label="Quoted weekly" value={formatMoney(stats.avgQuoted)} muted />
        ) : null}
        <Row label="Drivers actually clear" value={formatMoney(stats.avgWeekly ?? 0)} />
        {stats.avgQuoted != null ? (
          <>
            <div className="my-3 border-t border-dashed border-foreground/20" />
            <div className="flex items-baseline justify-between gap-3">
              <dt
                className={cn(
                  "text-xs tracking-wide uppercase",
                  missing > 0 ? "text-pay-down" : "text-pay-up",
                )}
              >
                {missing > 0 ? "Short of the quote" : missing < 0 ? "Ahead of the quote" : "Matches the quote"}
              </dt>
              <dd
                className={cn(
                  "font-heading text-3xl font-semibold tabular-nums",
                  missing > 0 ? "text-pay-down" : "text-pay-up",
                )}
              >
                {formatMoney(Math.abs(missing))}
              </dd>
            </div>
            <p className="pt-1 text-right text-xs text-muted-foreground">
              {missing === 0 ? "From filed slips" : `${Math.abs(gap)}% ${missing > 0 ? "under" : "over"} the quote`}
            </p>
          </>
        ) : (
          <p className="pt-2 text-xs text-muted-foreground">
            Average of driver-filed slips. No invented figures.
          </p>
        )}
      </dl>
    </Link>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", muted && "text-muted-foreground line-through decoration-foreground/30")}>
        {value}
      </dd>
    </div>
  );
}
