import { spanishCompanies } from "./spanish-companies";
import { fleet } from "@/lib/data";
import type { Company, DriverReport } from "@/lib/types";

/** Public, driver-declared companies. No private payslips or invented company facts. */
export function reportCompanies(reports: DriverReport[], market: "IE" | "GB" | "NL" | "ES" | "US" = "IE"): Company[] {
  const companies = new Map<string, Company>((market === "IE" ? fleet : market === "ES" ? spanishCompanies : []).map(company => [company.slug, company]));
  for (const report of reports) {
    if ((report.countryCode ?? "IE") !== market) continue;
    if (companies.has(report.companySlug) || typeof report.companyName !== "string" || !report.companyName.trim()) continue;
    const name = report.companyName.trim();
    companies.set(report.companySlug, {
      countryCode: report.countryCode ?? "IE", slug: report.companySlug, name, shortName: name, driverReported: true,
      initials: Array.from(name).slice(0, 2).join("").toUpperCase(), hue: 210,
      headquarters: "", county: "", website: "", summary: "", equipment: [], operations: [],
    });
  }
  return [...companies.values()];
}
