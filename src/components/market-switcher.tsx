"use client";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMarket } from "./market-provider";
import { useT } from "./language-provider";
import { markets, marketName, type Market } from "@/lib/markets";

const flags: Record<Market, string> = {
  IE: "🇮🇪",
  GB: "🇬🇧",
  NL: "🇳🇱",
  ES: "🇪🇸",
  US: "🇺🇸",
};

export function MarketSwitcher() {
  const market = useMarket();
  const { locale } = useT();
  const pathname = usePathname();
  const next = pathname.startsWith("/companies/") || pathname === "/compare" ? "/companies" : pathname;

  return (
    <nav aria-label={locale === "es" ? "País" : "Country"} className="relative bg-primary">
      <details
        className="group"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md py-2 text-xs font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true">{flags[market]}</span>
          <span>{marketName(market, locale === "es")}</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="absolute left-0 top-full z-50 flex w-56 flex-col gap-1 rounded-xl border border-primary-foreground/20 bg-primary p-2 shadow-xl">
          {markets.map((code) => (
            <a
              key={code}
              href={`/api/market?country=${code}&next=${encodeURIComponent(next)}`}
              aria-current={market === code ? "true" : undefined}
              className={`inline-flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-semibold ${
                market === code
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10"
              }`}
            >
              <span aria-hidden="true">{flags[code]}</span>
              <span>{marketName(code, locale === "es")}</span>
            </a>
          ))}
        </div>
      </details>
    </nav>
  );
}
