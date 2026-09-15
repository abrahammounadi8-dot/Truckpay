import { LOCALE_COOKIE, isLocale, localeMeta, type Locale } from "./config";

export function persistLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    /* private mode */
  }
  document.documentElement.lang = localeMeta[locale].htmlLang;
}

export function readStoredLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(LOCALE_COOKIE);
    if (isLocale(stored)) return stored;
  } catch {
    /* private mode */
  }
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`))
    ?.slice(LOCALE_COOKIE.length + 1);
  return isLocale(raw) ? raw : null;
}
