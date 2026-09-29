import { listDirectoryCompanies } from "@/lib/directory-store";
import { resolveEmployer } from "@/lib/payroll/employer";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/components/company-detail";
import { fleet } from "@/lib/data";
import { companyPayStats } from "@/lib/payroll/company-stats";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return fleet.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = ((await listDirectoryCompanies()).find(company => company.slug === slug || resolveEmployer(company.name).employerSlug === slug));
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
  const company = ((await listDirectoryCompanies()).find(company => company.slug === slug || resolveEmployer(company.name).employerSlug === slug));
  if (!company) notFound();
  const asOf = new Date().toISOString().slice(0, 10);
  const stats = companyPayStats(resolveEmployer(company.name).employerSlug ?? slug, [], [], asOf);
  return <CompanyDetail company={company} payStats={stats} />;
}
