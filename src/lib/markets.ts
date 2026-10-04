export const MARKET_COOKIE = "truckpay.market";
export const markets = ["IE", "GB", "NL", "ES", "US"] as const;
export type Market = (typeof markets)[number];

export function isMarket(value: unknown): value is Market {
  return value === "IE" || value === "GB" || value === "NL" || value === "ES" || value === "US";
}

export function marketFrom(value: unknown): Market {
  return isMarket(value) ? value : "IE";
}

export function belongsToMarket(value: { countryCode?: string }, market: Market): boolean {
  return (value.countryCode ?? "IE") === market;
}

export function marketName(market: Market, spanish: boolean): string {
  if (market === "GB") return spanish ? "Reino Unido" : "United Kingdom";
  if (market === "NL") return spanish ? "Países Bajos" : "Netherlands";
  if (market === "ES") return spanish ? "España" : "Spain";
  if (market === "US") return spanish ? "Estados Unidos" : "United States";
  return spanish ? "Irlanda" : "Ireland";
}

export type SupportedMarket = Market;

export function marketCurrency(market: SupportedMarket): "EUR" | "GBP" | "USD" {
  if (market === "GB") return "GBP";
  if (market === "US") return "USD";
  return "EUR";
}
