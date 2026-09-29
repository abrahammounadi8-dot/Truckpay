import "server-only";
import { companyPayStats } from "./payroll/company-stats";
import { resolveEmployer } from "./payroll/employer";
import { fleet } from "./data";

// Do not disclose a new employer's presence through private payroll during the publication pause.
export async function listDirectoryCompanies() { return fleet; }
export async function listDirectoryWithPayStats() {
  const companies = await listDirectoryCompanies();
  const payStats = Object.fromEntries(companies.map(company => [company.slug,
    companyPayStats(resolveEmployer(company.name).employerSlug ?? company.slug, [], [], "")]));
  return { companies, payStats };
}
