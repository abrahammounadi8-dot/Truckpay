import { fleet } from "@/lib/data";

export function slugifyEmployer(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "employer";
}

/** Any printed employer name is allowed. Known directory slugs are used only when the name matches. */
export function resolveEmployer(raw: string | null | undefined): {
  employerName: string | null;
  employerSlug: string | null;
} {
  const name = (raw ?? "").trim().slice(0, 120);
  if (!name) return { employerName: null, employerSlug: null };
  const lower = name.toLowerCase();
  const known = fleet.find(
    (company) =>
      company.slug === lower ||
      company.name.toLowerCase() === lower ||
      company.shortName.toLowerCase() === lower,
  );
  return {
    employerName: name,
    employerSlug: known ? known.slug : slugifyEmployer(name),
  };
}

export function employerLabel(slip: { employerName?: string | null; employerSlug?: string | null }): string | null {
  if (slip.employerName) return slip.employerName;
  if (!slip.employerSlug) return null;
  return fleet.find((company) => company.slug === slip.employerSlug)?.name ?? slip.employerSlug;
}
