import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { CompanyCard } from "@/components/company-card";
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
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Driver-reported settlements
            </p>
            <h1 className="mt-3 max-w-xl text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
              Recruiters quote a CPM. Drivers report what actually clears.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Truckpay puts advertised pay next to driver-reported weekly take-home,
              miles, home time, detention, and the rest of the job they do not print
              on the billboard.
            </p>
            <form action="/companies" className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
              <Input
                name="q"
                placeholder="Search Swift, reefer, Phoenix…"
                className="h-10 bg-card"
              />
              <button type="submit" className={cn(buttonVariants({ size: "lg" }), "h-10")}>
                Search carriers
              </button>
            </form>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
              <Stat value={String(fleet.length)} label="Carriers on the board" />
              <Stat value={reports.toLocaleString()} label="Driver reports" />
              <Stat value={`${avgGap}%`} label="Average pay gap" />
            </div>
          </div>
          <div className="grid gap-3">
            <Highlight
              kicker="Widest gap"
              title={worst.name}
              detail={`${payGapPercent(worst)}% under advertised weekly`}
              href={`/companies/${worst.slug}`}
            />
            <Highlight
              kicker="Highest reported weekly"
              title={bestPay.name}
              detail={`${formatMoney(reportedWeekly(bestPay))} typical take-home`}
              href={`/companies/${bestPay.slug}`}
            />
            <Highlight
              kicker="Closest to the ad"
              title={closest.name}
              detail={`${payGapPercent(closest)}% gap — recruiter number mostly holds`}
              href={`/companies/${closest.slug}`}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Biggest advertised-vs-real gaps</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sorted by how far weekly take-home sits under the recruiting number.
            </p>
          </div>
          <Link href="/rankings" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Full ranking
            <ArrowRightIcon />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          <Step n="01" title="Read the ad" body="We log the CPM, salary, miles, and bonus the carrier still publishes." />
          <Step n="02" title="Read the settlement" body="Drivers file weekly take-home, real miles, home time, and whether detention paid." />
          <Step n="03" title="See the gap" body="Compare up to three companies before you fly to orientation." />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Highlight({
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
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
    >
      <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {kicker}
      </p>
      <p className="mt-1 font-heading text-xl font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </Link>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-muted-foreground">{n}</p>
      <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
