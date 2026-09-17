import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { CompanyDirectory } from "@/components/company-directory";

export const metadata: Metadata = {
  title: "Irish haulier directory",
  description:
    "Browse Irish haulage firms. Driver-reported stubs and payroll-verified medians are labelled separately. No invented company salary.",
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageIntro kicker="companies.kicker" title="companies.title" lead="companies.lead" />
      <div className="mt-8">
        <CompanyDirectory initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
