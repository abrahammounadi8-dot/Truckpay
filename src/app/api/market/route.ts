import { NextResponse } from "next/server";
import { MARKET_COOKIE, isMarket } from "@/lib/markets";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  if (!isMarket(country)) return Response.json({ error: "Unsupported country" }, { status: 400 });
  const next = url.searchParams.get("next") ?? "/";
  const safe = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") && !/[\u0000-\u001f]/.test(next) ? next : "/";
  const response = NextResponse.redirect(new URL(safe, url.origin), 303);
  response.cookies.set(MARKET_COOKIE, country, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return response;
}
