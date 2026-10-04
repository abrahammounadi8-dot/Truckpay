"use client";
import { createContext, useContext } from "react";
import type { Market } from "@/lib/markets";
const MarketContext = createContext<Market>("IE");
export function MarketProvider({ market, children }: { market: Market; children: React.ReactNode }) {
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}
export function useMarket() { return useContext(MarketContext); }

export function useMarketMoney() {
  const market = useMarket();
  return (value: number) => new Intl.NumberFormat(market === "GB" ? "en-GB" : market === "NL" ? "nl-NL" : "en-IE", { style: "currency", currency: market === "GB" ? "GBP" : "EUR", maximumFractionDigits: 0 }).format(value);
}
