import "server-only";
import { headers } from "next/headers";
import { MARKET_COOKIE, marketFrom } from "./markets";
import { spanishCompanies } from "./spanish-companies";
import { addPublicAddresses } from "./company-address-store";
import { companyPayStats } from "./payroll/company-stats";
import { resolveEmployer } from "./payroll/employer";
import { publicStatisticsSource } from "./payroll/public-statistics-source";
import { eligibleDirectoryEmployers } from "./payroll/directory-eligibility";
import { addRegisteredEmployers } from "./directory-companies";
import { fleet } from "./data";
import { recentPublicationCompanies } from "./payroll/recent-publications";

export async function listDirectoryWithPayStats() {
  const market = marketFrom((await headers()).get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${MARKET_COOKIE}=`))?.slice(MARKET_COOKIE.length + 1));
  const source = await publicStatisticsSource();
  const payslips = source.payslips.filter(slip => slip.countryCode === market && slip.currency === "EUR");
  const profiles = source.profiles.filter(profile => profile.countryCode === market);
  const catalogue = market === "IE" ? fleet : spanishCompanies;
  const companies = recentPublicationCompanies(addRegisteredEmployers(catalogue, eligibleDirectoryEmployers(payslips, profiles), market), payslips, profiles, new Date().toISOString());
  const asOf = new Date().toISOString().slice(0, 10);
  const payStats = Object.fromEntries(companies.map(company => [company.slug,
    companyPayStats(resolveEmployer(company.name).employerSlug ?? company.slug, payslips, profiles, asOf)]));
  return { companies: market === "IE" ? (await addPublicAddresses(companies)).map(company => ({ ...company, countryCode: market })) : companies.map(company => ({ ...company, countryCode: market })), payStats };
}
export async function listDirectoryCompanies() { return (await listDirectoryWithPayStats()).companies; }
