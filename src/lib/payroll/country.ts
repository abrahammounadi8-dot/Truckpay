import { MARKET_COOKIE, marketFrom, type Market } from "../markets";

export function payrollCountry(request: Request): Market {
  const country = request.headers.get("cookie")
    ?.split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${MARKET_COOKIE}=`))
    ?.slice(MARKET_COOKIE.length + 1);

  return marketFrom(country);
}
