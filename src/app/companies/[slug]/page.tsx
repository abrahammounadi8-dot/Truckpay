import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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
    <div>
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link href="/companies" className="text-xs tracking-wide text-primary-foreground/55 uppercase hover:text-primary-foreground">
            ← Directory
          </Link>
          <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <CompanyMark company={company} size="lg" />
              <div>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{company.name}</h1>
                <p className="mt-2 text-sm text-primary-foreground/65">
                  {company.headquarters} · founded {company.founded} · {formatNumber(company.fleetSize)} trucks
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StarRating value={company.reported.rating} size="md" inverted />
                  <span className="text-sm text-primary-foreground/65">
                    {company.reported.reviewCount} seeded reports
                  </span>
                  <Badge className="border-0 bg-accent text-accent-foreground">{gap}% short of the ad</Badge>
                </div>
              </div>
            </div>
            <CompanyActions slug={company.slug} onDark />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="max-w-2xl text-base leading-7 text-pretty">{company.summary}</p>
            <blockquote className="mt-5 max-w-2xl border-l-2 border-accent pl-4 text-sm text-muted-foreground italic">
              Recruiter copy: “{company.advertised.claim}”
            </blockquote>
          </div>
          <div className="stub-paper rounded-xl p-5 ring-1 ring-foreground/10">
            <PayGapBar company={company} />
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-dashed border-border pt-4 text-sm">
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
            <div className="mt-3 flex flex-wrap gap-1">
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
              <p className="mt-3 text-xs text-muted-foreground">{company.conditions.trainerNote}</p>
            ) : null}
          </ConditionCard>
        </div>

        <section className="mt-14">
          <h2 className="text-3xl font-semibold tracking-tight">Driver reports</h2>
          <p className="mt-2 mb-6 max-w-2xl text-sm text-muted-foreground">
            Seeded settlements plus community reports filed on this Truckpay instance.
          </p>
          <CompanyReviews slug={company.slug} seeded={seeded} />
        </section>
      </div>
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
    <div className="rounded-xl bg-card p-5 text-sm ring-1 ring-foreground/10">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <div className="mt-3 space-y-1.5">{children}</div>
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
