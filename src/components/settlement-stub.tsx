import Link from "next/link";
import { CompanyMark } from "@/components/company-mark";
import { advertisedWeekly, formatMoney, payGapDollars, payGapPercent, reportedWeekly } from "@/lib/metrics";
import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SettlementStub({ company }: { company: Company }) {
  const advertised = advertisedWeekly(company);
  const reported = reportedWeekly(company);
  const gap = payGapPercent(company);
  const missing = payGapDollars(company);

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
          Stub 00{gap}
        </span>
      </div>

      <dl className="mt-5 space-y-2 font-mono text-sm">
        <Row label="Advertised CPM × miles" value={formatMoney(advertised)} muted />
        <Row label="Drivers actually clear" value={formatMoney(reported)} />
        <div className="my-3 border-t border-dashed border-foreground/20" />
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs tracking-wide text-pay-down uppercase">Missing this week</dt>
          <dd className={cn("font-heading text-3xl font-semibold tabular-nums text-pay-down")}>
            {formatMoney(missing)}
          </dd>
        </div>
        <p className="pt-1 text-right text-xs text-muted-foreground">{gap}% under the recruiter number</p>
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
