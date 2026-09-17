import { requireComparisonAccess } from "@/lib/payroll/access";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/components/company-detail";
import { fleet, getCompany } from "@/lib/data";
import { companyPayStats } from "@/lib/payroll/company-stats";
import { listProfiles } from "@/lib/payroll/profile-store";
import { listAllPayslips } from "@/lib/payroll/store";

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
  await requireComparisonAccess();
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();
  const asOf = new Date().toISOString().slice(0, 10);
  const stats = companyPayStats(slug, await listAllPayslips(), await listProfiles(), asOf);
  return <CompanyDetail company={company} payStats={stats} />;
}
