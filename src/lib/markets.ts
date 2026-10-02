export const MARKET_COOKIE = "truckpay.market";
export const markets = ["IE", "ES"] as const;
export type Market = (typeof markets)[number];
export function isMarket(value: unknown): value is Market { return value === "IE" || value === "ES"; }
export function marketFrom(value: unknown): Market { return isMarket(value) ? value : "IE"; }
export function belongsToMarket(value: { countryCode?: string }, market: Market): boolean {
  return (value.countryCode ?? "IE") === market;
}
export function marketName(market: Market, spanish: boolean): string {
  return market === "ES" ? (spanish ? "España" : "Spain") : (spanish ? "Irlanda" : "Ireland");
}
