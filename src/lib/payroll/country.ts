import { MARKET_COOKIE } from "../markets";
export function payrollCountry(request: Request): "IE" | "US" {
  const country = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${MARKET_COOKIE}=`))?.slice(MARKET_COOKIE.length + 1);
  return country === "US" ? "US" : "IE";
}
