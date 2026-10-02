"use client";
import { createContext, useContext } from "react";
import type { Market } from "@/lib/markets";
const MarketContext = createContext<Market>("IE");
export function MarketProvider({ market, children }: { market: Market; children: React.ReactNode }) {
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}
export function useMarket() { return useContext(MarketContext); }
