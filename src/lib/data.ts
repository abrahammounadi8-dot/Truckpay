import type { Company } from "@/lib/types";

/**
 * Irish haulage firms with public facts only: HQ, founding year where published,
 * what they haul, and figures they print on their own sites. No pay, no ratings,
 * no driver reviews — those come from settlements drivers file themselves.
 */
export const companies: Company[] = [
  {
    slug: "nolan",
    name: "Nolan Transport",
    shortName: "Nolan",
    initials: "NT",
    hue: 220,
    headquarters: "New Ross, Co. Wexford",
    county: "Wexford",
    founded: 1963,
    website: "https://www.nolantransport.com",
    fleetNote: "2,700+ owned transport units; 1,000+ employees (company site)",
    equipment: ["curtain", "reefer", "specialized"],
    operations: ["domestic", "uk", "europe"],
    summary:
      "Irish-headquartered asset-based logistics firm, founded in 1963. Public figures: 100,000+ freight loads a year and 23,300 m² of warehousing.",
  },
  {
    slug: "hannon",
    name: "Hannon Logistics",
    shortName: "Hannon",
    initials: "HN",
    hue: 145,
    headquarters: "Blakes Cross, Co. Dublin",
    county: "Dublin",
    website: "https://hannontransport.com",
    fleetNote: "400+ employees (company site)",
    equipment: ["reefer"],
    operations: ["domestic", "uk", "europe"],
    summary:
      "Chilled and frozen specialist across Ireland, the UK and Europe, with a Republic of Ireland base at Coldwinters, Blakes Cross, and a Northern Ireland depot in Aghalee.",
  },
  {
    slug: "tarrant",
    name: "Tarrant International",
    shortName: "Tarrant",
    initials: "TT",
    hue: 28,
    headquarters: "Glanmire, Co. Cork",
    county: "Cork",
    founded: 1973,
    website: "https://www.tarrantinternational.com",
    equipment: ["reefer", "curtain"],
    operations: ["domestic", "uk", "europe"],
    summary:
      "Cork haulier since 1973. Public specialisms: GDP pharmaceutical, meat, fish and dairy, plus dry groupage from Sarsfield Court, Glanmire.",
  },
  {
    slug: "tranziberia",
    name: "Tranziberia",
    shortName: "Tranziberia",
    initials: "TZ",
    hue: 12,
    headquarters: "Carlow",
    county: "Carlow",
    founded: 2003,
    website: "https://www.tranziberia.com",
    equipment: ["reefer", "curtain"],
    operations: ["europe"],
    summary:
      "Irish family-owned haulier focused on Ireland–Spain–Portugal lanes for food, pharma and general freight. Company site cites 3.9 million km a year.",
  },
  {
    slug: "primeline",
    name: "Primeline Group",
    shortName: "Primeline",
    initials: "PL",
    hue: 255,
    headquarters: "Ireland",
    county: "Ireland",
    website: "https://primeline.ie",
    fleetNote: "400+ trucks; 1.6 million boxes a week to 7,500+ retailers (company site)",
    equipment: ["curtain", "reefer"],
    operations: ["domestic", "uk"],
    summary:
      "Independent Irish supply-chain and route-to-market group serving brands and retailers in Ireland and the UK.",
  },
  {
    slug: "roadtrain",
    name: "Roadtrain",
    shortName: "Roadtrain",
    initials: "RT",
    hue: 40,
    headquarters: "Bluebell, Dublin 12",
    county: "Dublin",
    founded: 1930,
    website: "https://www.roadtrain.ie",
    equipment: ["curtain", "flatbed", "specialized"],
    operations: ["domestic", "uk", "europe"],
    summary:
      "Family-owned distribution firm dating to the 1930s. Head office at the Roadtrain Complex, Bluebell Industrial Estate, with a Kingscourt, Co. Cavan site.",
  },
  {
    slug: "oleary",
    name: "O'Leary International",
    shortName: "O'Leary",
    initials: "OL",
    hue: 195,
    headquarters: "New Ross, Co. Wexford",
    county: "Wexford",
    founded: 1989,
    website: "https://www.olearyinternational.com",
    fleetNote: "200+ trucks and 350 trailers (company site)",
    equipment: ["curtain", "reefer", "specialized"],
    operations: ["domestic", "uk", "europe"],
    summary:
      "Irish-owned road transport from Marshmeadows, New Ross, with bases in Ireland, the UK and Poland. Public sectors include pharma, food, IT and retail.",
  },
  {
    slug: "perennial",
    name: "Perennial Freight",
    shortName: "Perennial",
    initials: "PF",
    hue: 350,
    headquarters: "Taghmon, Co. Wexford",
    county: "Wexford",
    website: "https://www.perennialfreight.com",
    fleetNote: "150+ trucks and 1,000 trailers (company site)",
    equipment: ["curtain", "tanker", "specialized"],
    operations: ["uk", "europe"],
    summary:
      "Wexford haulier at Poulmarle, Taghmon, with a Rosslare Europort warehouse. Public services include full loads, ADR, waste cargo and customs.",
  },
];

export const fleet: Company[] = companies;

export function getCompany(slug: string): Company | undefined {
  return fleet.find((company) => company.slug === slug);
}

export function companyBySlug(slug: string): Company | undefined {
  return getCompany(slug);
}
