import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyActions, CompanyReviews } from "@/components/company-detail";
import { CompanyMark } from "@/components/company-mark";
import { PayGapBar } from "@/components/pay-gap-bar";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { fleet, getCompany, reviewsFor } from "@/lib/data";
import {
  advertisedWeekly,
  equipmentLabels,
  formatCpm,
  formatMoney,
  formatNumber,
  homeTimeLabel,
  operationLabels,
  payGapPercent,
  payTypeLabels,
  reportedWeekly,
} from "@/lib/metrics";

export function generateStaticParams() {
  return fleet.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) return { title: "Company" };
  return {
    title: company.name,
    description: company.summary,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  const gap = payGapPercent(company);
  const seeded = reviewsFor(company.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <CompanyMark company={company} size="lg" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{company.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {company.headquarters} · founded {company.founded} · {formatNumber(company.fleetSize)} trucks
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StarRating value={company.reported.rating} size="md" />
                <span className="text-sm text-muted-foreground">
                  {company.reported.reviewCount} seeded reports
                </span>
                <Badge variant={gap >= 12 ? "destructive" : "secondary"}>{gap}% pay gap</Badge>
              </div>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-pretty">{company.summary}</p>
          <p className="mt-3 max-w-2xl border-l-2 border-accent pl-3 text-sm text-muted-foreground italic">
            “{company.advertised.claim}”
          </p>
          <div className="mt-5">
            <CompanyActions slug={company.slug} />
          </div>
        </div>
        <div className="w-full rounded-xl border border-border bg-card p-5 lg:max-w-md">
          <PayGapBar company={company} />
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Item label="Advertised weekly" value={formatMoney(advertisedWeekly(company))} />
            <Item label="Reported weekly" value={formatMoney(reportedWeekly(company))} />
            <Item label="Advertised CPM" value={formatCpm(company.advertised.cpm)} />
            <Item label="Reported CPM" value={formatCpm(company.reported.cpm)} />
            <Item
              label="Sign-on (ad)"
              value={company.advertised.signOnBonus ? formatMoney(company.advertised.signOnBonus) : "—"}
            />
            <Item label="Pay type" value={payTypeLabels[company.payType]} />
          </dl>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <ConditionCard title="The job">
          <p>{homeTimeLabel(company.reported.homeTimeDaysOut)}</p>
          <p>{company.conditions.averageHours} hours in a typical week</p>
          <p>Trucks: {company.conditions.truckAge}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {company.equipment.map((item) => (
              <Badge key={item} variant="outline">
                {equipmentLabels[item]}
              </Badge>
            ))}
            {company.operations.map((item) => (
              <Badge key={item} variant="secondary">
                {operationLabels[item]}
              </Badge>
            ))}
          </div>
        </ConditionCard>
        <ConditionCard title="What they pay for">
          <Flag ok={company.conditions.detentionPaid} yes="Detention paid" no="Detention unpaid" />
          <Flag ok={company.conditions.layoverPaid} yes="Layover paid" no="Layover unpaid" />
          <Flag ok={company.conditions.orientationPaid} yes="Orientation paid" no="Orientation unpaid" />
        </ConditionCard>
        <ConditionCard title="How they run">
          <Flag ok={!company.conditions.forcedDispatch} yes="No forced dispatch" no="Forced dispatch" />
          <Flag ok={!company.conditions.slipSeating} yes="Assigned truck" no="Slip seating" />
          <Flag ok={company.conditions.petFriendly} yes="Pets allowed" no="No pets" />
          <Flag ok={company.conditions.passengerPolicy} yes="Passenger policy" no="No passengers" />
          {company.conditions.trainerNote ? (
            <p className="mt-2 text-xs text-muted-foreground">{company.conditions.trainerNote}</p>
          ) : null}
        </ConditionCard>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Driver reports</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Seeded reports plus anything you file in this browser.
        </p>
        <CompanyReviews slug={company.slug} seeded={seeded} />
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function ConditionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function Flag({
  ok,
  yes,
  no,
}: {
  ok: boolean;
  yes: string;
  no: string;
}) {
  return <p className={ok ? "text-pay-up" : "text-pay-down"}>{ok ? yes : no}</p>;
}
