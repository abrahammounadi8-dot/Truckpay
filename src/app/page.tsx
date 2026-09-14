import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { CompanyCard } from "@/components/company-card";
import { SettlementStub } from "@/components/settlement-stub";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fleet } from "@/lib/data";
import { formatMoney, payGapPercent, reportedWeekly } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const worst = [...fleet].sort((a, b) => payGapPercent(b) - payGapPercent(a))[0];
  const bestPay = [...fleet].sort((a, b) => reportedWeekly(b) - reportedWeekly(a))[0];
  const closest = [...fleet].sort((a, b) => payGapPercent(a) - payGapPercent(b))[0];
  const featured = [...fleet].sort((a, b) => payGapPercent(b) - payGapPercent(a)).slice(0, 4);
  const avgGap = Math.round(fleet.reduce((sum, company) => sum + payGapPercent(company), 0) / fleet.length);
  const reports = fleet.reduce((sum, company) => sum + company.reported.reviewCount, 0);

  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-accent uppercase">
              Driver-reported settlements
            </p>
            <h1 className="mt-4 max-w-xl text-4xl leading-[0.95] font-semibold tracking-tight sm:text-6xl">
              The billboard pays one number. The stub pays another.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-primary-foreground/75">
              Truckpay lines advertised CPM and salary up against what drivers say
              actually clears: weekly take-home, miles, home time, detention, and
              the rest they do not print on the side of the truck.
            </p>
            <form action="/companies" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
              <Input
                name="q"
                placeholder="Search Swift, reefer, Phoenix…"
                className="h-11 border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/45"
              />
              <button
                type="submit"
                className={cn(buttonVariants({ size: "lg" }), "h-11 bg-accent text-accent-foreground hover:bg-accent/90")}
              >
                Search carriers
              </button>
            </form>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-primary-foreground/12 pt-6">
              <Stat value={String(fleet.length)} label="Carriers" />
              <Stat value={reports.toLocaleString()} label="Reports" />
              <Stat value={`${avgGap}%`} label="Avg. gap" />
            </div>
          </div>
          <div className="lg:pl-4">
            <p className="mb-3 text-[0.68rem] font-semibold tracking-[0.18em] text-primary-foreground/55 uppercase">
              Worst gap on the board this week
            </p>
            <SettlementStub company={worst} />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-px px-4 py-0 sm:grid-cols-3 sm:px-0">
          <Mini
            kicker="Widest gap"
            title={worst.shortName}
            detail={`${payGapPercent(worst)}% under advertised weekly`}
            href={`/companies/${worst.slug}`}
          />
          <Mini
            kicker="Highest reported weekly"
            title={bestPay.shortName}
            detail={`${formatMoney(reportedWeekly(bestPay))} typical take-home`}
            href={`/companies/${bestPay.slug}`}
          />
          <Mini
            kicker="Closest to the ad"
            title={closest.shortName}
            detail={`${payGapPercent(closest)}% gap — the pitch mostly holds`}
            href={`/companies/${closest.slug}`}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Biggest advertised-vs-real gaps</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Sorted by how far weekly take-home sits under the recruiting number.
              Open a file before you fly to orientation.
            </p>
          </div>
          <Link href="/rankings" className={cn(buttonVariants({ variant: "outline" }))}>
            Full ranking
            <ArrowRightIcon />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {featured.map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
          <Step n="01" title="Read the ad" body="We log the CPM, salary, miles, and bonus the carrier still publishes." />
          <Step n="02" title="Read the stub" body="Drivers file weekly take-home, real miles, home time, and whether detention paid." />
          <Step n="03" title="See the gap" body="Compare up to three companies. The missing dollars sit on one line." />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs tracking-wide text-primary-foreground/55 uppercase">{label}</p>
    </div>
  );
}

function Mini({
  kicker,
  title,
  detail,
  href,
}: {
  kicker: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="px-4 py-6 transition-colors hover:bg-muted/70 sm:px-8">
      <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {kicker}
      </p>
      <p className="mt-1 font-heading text-2xl font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </Link>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-accent">{n}</p>
      <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-primary-foreground/70">{body}</p>
    </div>
  );
}
