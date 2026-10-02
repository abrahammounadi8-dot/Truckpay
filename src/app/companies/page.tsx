import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { CompanyDirectory } from "@/components/company-directory";

export const metadata: Metadata = {
  title: "Transport company directory",
  description:
    "Browse transport companies by country. Driver-reported stubs and payroll-verified medians are labelled separately. No invented company salary.",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-2xl border-b-4 border-accent bg-primary px-5 py-7 text-primary-foreground shadow-md sm:px-8 sm:py-9 [&>p]:text-primary-foreground/80 [&>p:first-child]:text-accent">
        <PageIntro kicker="companies.kicker" title="companies.title" lead="companies.lead" />
      </section>
      <div className="mt-8">
        <CompanyDirectory initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
