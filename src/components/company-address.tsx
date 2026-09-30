"use client";
import { MapPin, ExternalLink } from "lucide-react";
import { useT } from "./language-provider";
import { mapSearchUrl } from "@/lib/company-address";
import type { Company } from "@/lib/types";

export function CompanyAddress({ company }: { company: Company }) {
  const { locale } = useT();
  const es = locale === "es";
  const location = company.publicAddress;
  return <div className="mt-3 space-y-1.5 text-xs leading-5">
    <p className="flex items-start gap-1.5"><MapPin className="mt-1 size-3.5 shrink-0" /><span>{location?.address ?? (es ? "Dirección pendiente de confirmar" : "Address awaiting confirmation")}</span></p>
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      <a className="inline-flex items-center gap-1 underline underline-offset-2" href={location?.mapUrl ?? mapSearchUrl(`${company.name} ${company.headquarters}`.trim())} target="_blank" rel="noopener noreferrer">{location ? (es ? "Ver en el mapa" : "View on map") : (es ? "Buscar en el mapa" : "Search on map")}<ExternalLink className="size-3" /></a>
      {location && <a className="underline underline-offset-2" href={location.sourceUrl} target="_blank" rel="noopener noreferrer">{es ? "Fuente" : "Source"}: {location.sourceName}</a>}
      {location?.sourceName === "OpenStreetMap" && <a className="underline underline-offset-2" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>}
    </div>
  </div>;
}
