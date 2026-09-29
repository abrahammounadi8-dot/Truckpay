import { fleet } from "@/lib/data";
import type { Company, DriverReport } from "@/lib/types";

/** Public, driver-declared companies. No private payslips or invented company facts. */
export function reportCompanies(reports: DriverReport[]): Company[] {
  const companies = new Map<string, Company>(fleet.map(company => [company.slug, company]));
  for (const report of reports) {
    if (companies.has(report.companySlug) || typeof report.companyName !== "string" || !report.companyName.trim()) continue;
    const name = report.companyName.trim();
    companies.set(report.companySlug, {
      slug: report.companySlug, name, shortName: name, driverReported: true,
      initials: Array.from(name).slice(0, 2).join("").toUpperCase(), hue: 210,
      headquarters: "", county: "", website: "", summary: "", equipment: [], operations: [],
    });
  }
  return [...companies.values()];
}
