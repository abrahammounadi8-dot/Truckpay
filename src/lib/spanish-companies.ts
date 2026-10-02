import type { Company } from "./types";
/** Basic company facts from their official sites. No salary or review claims. */
export const spanishCompanies: Company[] = [
  { countryCode: "ES", slug: "es-primafrio", name: "Primafrio", shortName: "Primafrio", initials: "PF", hue: 145,
    headquarters: "Alhama de Murcia", county: "Murcia", website: "https://www.primafrio.com/",
    summary: "Transporte frigorífico nacional e internacional. Sede central en Alhama de Murcia.", equipment: ["reefer"], operations: ["domestic", "europe"],
    publicAddress: { address: "Autovía del Mediterráneo, km 596, 30840 Alhama de Murcia, España", sourceUrl: "https://www.primafrio.com/grupo-primafrio/quienes-somos/sedes/", sourceName: "Primafrio · Sedes", mapUrl: "https://www.google.com/maps/search/?api=1&query=Primafrio+Alhama+de+Murcia" } },
  { countryCode: "ES", slug: "es-sese", name: "Sesé", shortName: "Sesé", initials: "SE", hue: 215,
    headquarters: "Zaragoza", county: "Zaragoza", website: "https://gruposese.com/",
    summary: "Grupo de transporte y logística con oficinas corporativas en Zaragoza.", equipment: [], operations: [],
    publicAddress: { address: "Zaragoza, España", sourceUrl: "https://gruposese.com/contacto/", sourceName: "Sesé · Contacto", mapUrl: "https://www.google.com/maps/search/?api=1&query=Sese+Zaragoza" } },
];
