import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyDetail } from "@/components/company-detail";
import { fleet, getCompany } from "@/lib/data";
import { listProfiles } from "@/lib/payroll/profile-store";
import { listAllPayslips } from "@/lib/payroll/store";
import { publicCompanyStats, publicCompanyStatsEnabled } from "@/lib/payroll/public-company-stats";

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
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();
  let payStats = null;
  if (publicCompanyStatsEnabled()) {
    const [payslips, profiles] = await Promise.all([listAllPayslips(), listProfiles()]);
    payStats = publicCompanyStats(slug, payslips, profiles);
  }
  return <CompanyDetail company={company} payStats={payStats} />;
}
