import type { Company } from "./types";

type PublicAddress = NonNullable<Company["publicAddress"]>;
export const mapSearchUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const nameKey = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+(limited|ltd|inc|llc|plc)$/, "").trim();

// Public sources checked 2026-09-30. Never populate this from payslip addresses.
const reviewed: Record<string, { address: string; sourceUrl: string; sourceName: string }> = {
  eirtrans: { address: "Unit 7, Greenogue Business Plaza, Rathcoole, Co. Dublin, Ireland", sourceUrl: "https://eirtrans.com/", sourceName: "Eirtrans" },
  "stateline transport": { address: "Compass Business Park, Charter School Hill, Dublin 9, D09 P2NF, Ireland", sourceUrl: "https://employer.jobsireland.ie/Reports/GetJobsDetail?id=2426199", sourceName: "JobsIreland" },
};

export function reviewedCompanyAddress(name: string): PublicAddress | undefined {
  const value = reviewed[nameKey(name)];
  return value ? { ...value, mapUrl: mapSearchUrl(`${name}, ${value.address}`) } : undefined;
}

const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" ? v as Record<string, unknown> : {};
const text = (v: unknown) => typeof v === "string" && v.length <= 250 && !/[<>\r\n]/.test(v) ? v.trim() : "";

/** A search suggestion is not an address: require a unique exact business name and street-level data. */
export function selectCompanyAddress(name: string, result: unknown): PublicAddress | undefined {
  const features = record(result).features;
  if (!Array.isArray(features) || features.length >= 10) return;
  const matches = features.filter(feature => nameKey(text(record(record(feature).properties).name)) === nameKey(name));
  // Multiple branches and incomplete matches are deliberately left unresolved.
  if (matches.length !== 1) return;
  const feature = record(matches[0]);
  const p = record(feature.properties);
  if (!["office", "industrial", "craft", "shop", "building", "landuse"].includes(text(p.osm_key))) return;
  if (p.osm_value === "residential" || p.osm_value === "house" || p.osm_value === "apartments") return;
  const street = text(p.street), city = text(p.city), country = text(p.country);
  if (!street || !city || !country) return;
  const coordinates = record(feature.geometry).coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return;
  const [lon, lat] = coordinates;
  if (typeof lon !== "number" || typeof lat !== "number" || !Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) return;
  const osmType = ({ N: "node", W: "way", R: "relation" } as Record<string, string>)[text(p.osm_type)];
  if (!osmType || !Number.isSafeInteger(p.osm_id) || Number(p.osm_id) <= 0) return;
  const address = [[text(p.housenumber), street].filter(Boolean).join(" "), city, text(p.postcode), country].filter(Boolean).join(", ");
  return { address, sourceName: "OpenStreetMap", sourceUrl: `https://www.openstreetmap.org/${osmType}/${p.osm_id}`, mapUrl: mapSearchUrl(`${lat},${lon}`) };
}
