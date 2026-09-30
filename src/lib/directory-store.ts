import "server-only";
import { addPublicAddresses } from "./company-address-store";
import { companyPayStats } from "./payroll/company-stats";
import { resolveEmployer } from "./payroll/employer";
import { publicStatisticsSource } from "./payroll/public-statistics-source";
import { eligibleDirectoryEmployers } from "./payroll/directory-eligibility";
import { addRegisteredEmployers } from "./directory-companies";
import { fleet } from "./data";
import { recentPublicationCompanies } from "./payroll/recent-publications";

export async function listDirectoryWithPayStats() {
  const { payslips, profiles } = await publicStatisticsSource();
  const companies = recentPublicationCompanies(addRegisteredEmployers(fleet, eligibleDirectoryEmployers(payslips, profiles)), payslips, profiles, new Date().toISOString());
  const asOf = new Date().toISOString().slice(0, 10);
  const payStats = Object.fromEntries(companies.map(company => [company.slug,
    companyPayStats(resolveEmployer(company.name).employerSlug ?? company.slug, payslips, profiles, asOf)]));
  return { companies: await addPublicAddresses(companies), payStats };
}
export async function listDirectoryCompanies() { return (await listDirectoryWithPayStats()).companies; }
