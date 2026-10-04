import type { Company } from "./types";
import type { Market } from "./markets";
import { fleet } from "./data";

const listed = (countryCode: Exclude<Market, "IE">, names: readonly string[]): Company[] =>
  names.map((name, index) => ({
    countryCode,
    slug: `${countryCode.toLowerCase()}-${name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    name,
    shortName: name,
    initials: name.split(/\s+/).map(part => part[0]).join("").slice(0, 3).toUpperCase(),
    hue: 190 + (index * 17) % 150,
    headquarters: "",
    county: "",
    website: "",
    summary: "Salary data is not available yet.",
    equipment: [],
    operations: [],
  }));

export const usCompanies = listed("US", [
  "Schneider",
  "J.B. Hunt",
  "Werner Enterprises",
  "Knight-Swift Transportation",
  "Old Dominion Freight Line",
  "Estes Express Lines",
  "Prime Inc.",
  "C.R. England",
  "Roehl Transport",
  "TMC Transportation",
]);

export const esCompanies = listed("ES", [
  "Primafrio",
  "Sesé",
  "Marcotran",
  "Ontime",
  "Carreras Grupo Logístico",
  "Acotral",
  "Disfrimur",
  "ESP Solutions",
  "Transaher",
  "Logista",
]);

export const nlCompanies = listed("NL", [
  "Simon Loos",
  "Vos Logistics",
  "Jan de Rijk Logistics",
  "Van den Bosch",
  "Ewals Cargo Care",
  "Nijhof-Wassink",
  "De Rijke Group",
  "Neele-Vat Logistics",
  "Wolter Koops",
  "Heisterkamp Transportation Solutions",
]);

export const gbCompanies = listed("GB", [
  "Unipart Logistics",
  "Great Bear Distribution",
  "GXO Logistics UK",
  "DHL Supply Chain UK",
  "XPO Transport Solutions UK",
  "W.H. Bowker",
  "Gregory Distribution",
  "Culina Logistics",
  "Wincanton",
  "Turners (Soham)",
]);

export function catalogForMarket(market: Market): Company[] {
  if (market === "IE") return fleet;
  if (market === "ES") return esCompanies;
  if (market === "US") return usCompanies;
  if (market === "NL") return nlCompanies;
  return gbCompanies;
}
