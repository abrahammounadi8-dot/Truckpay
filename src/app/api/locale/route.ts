import { NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

export const runtime = "nodejs";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}

function requestOrigin(request: Request): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin.replace("://0.0.0.0", "://127.0.0.1");
}

function redirectWithLocale(request: Request, locale: string | null, nextPath: string) {
  const url = new URL(safeNext(nextPath), requestOrigin(request));
  const response = NextResponse.redirect(url, { status: 303 });
  if (isLocale(locale)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return redirectWithLocale(request, url.searchParams.get("lang"), url.searchParams.get("next") ?? "/");
}

export async function POST(request: Request) {
  const form = await request.formData();
  return redirectWithLocale(
    request,
    String(form.get("locale") ?? ""),
    String(form.get("next") ?? "/"),
  );
}
