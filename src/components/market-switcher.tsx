"use client";
import { usePathname } from "next/navigation";
import { useMarket } from "./market-provider";
import { useT } from "./language-provider";
import { markets, marketName } from "@/lib/markets";
export function MarketSwitcher() {
  const market = useMarket();
  const { locale } = useT();
  const pathname = usePathname();
  // A company detail belongs to its country; changing market returns to its directory.
  const next = pathname.startsWith("/companies/") || pathname === "/compare" ? "/companies" : pathname;
  return <nav aria-label={locale === "es" ? "País" : "Country"} className="border-t border-primary-foreground/15 bg-primary">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
      <span className="mr-1 text-xs text-primary-foreground/75">{locale === "es" ? "Mercado" : "Market"}</span>
      {markets.map(code => <a key={code} href={`/api/market?country=${code}&next=${encodeURIComponent(next)}`} aria-current={market === code ? "true" : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold ${market === code ? "bg-accent text-accent-foreground" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}>{marketName(code, locale === "es")}</a>)}
    </div>
  </nav>;
}
