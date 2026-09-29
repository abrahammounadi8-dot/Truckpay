import type { Company } from "./types";
import { slugifyEmployer } from "./payroll/employer";

export const companyNameKey = (name: string) => name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
/** Deliberately project employer identity only; never spread a private record. */
export function addRegisteredEmployers(companies: Company[], employers: { employerName?: string | null; employerSlug?: string | null }[]): Company[] {
  const result = [...companies];
  const names = new Set(result.flatMap(c => [companyNameKey(c.name), companyNameKey(c.shortName)]));
  const slugs = new Set(result.map(c => c.slug));
  for (const employer of employers) {
    const name = (employer.employerName ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
    if (!name || name.length > 120 || /[@<>\r\n]/.test(name)) continue;
    const key = companyNameKey(name);
    if (!key || names.has(key)) continue;
    const slug = slugifyEmployer(name);
    if (!slug || slugs.has(slug)) continue;
    result.push({ slug, name, shortName: name, driverReported: true, initials: Array.from(name).slice(0, 2).join("").toUpperCase(), hue: 210,
      headquarters: "", county: "", website: "", summary: "", equipment: [], operations: [] });
    names.add(key); slugs.add(slug);
  }
  return result;
}
