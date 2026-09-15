export const locales = ["en", "es", "pl", "pt"] as const;
export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "tp_lang";

export const localeMeta: Record<Locale, { nativeName: string; htmlLang: string }> = {
  en: { nativeName: "English", htmlLang: "en-IE" },
  es: { nativeName: "Español", htmlLang: "es" },
  pl: { nativeName: "Polski", htmlLang: "pl" },
  pt: { nativeName: "Português", htmlLang: "pt" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

export function localeFromBrowser(language: string | undefined): Locale {
  const tag = (language ?? "").toLowerCase();
  const code = tag.split("-")[0];
  if (isLocale(code)) return code;
  if (tag.startsWith("es")) return "es";
  if (tag.startsWith("pl")) return "pl";
  if (tag.startsWith("pt")) return "pt";
  return DEFAULT_LOCALE;
}

export function localeFromRequest(
  cookieValue: string | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const tags = acceptLanguage.split(",").map((part) => part.trim().split(";")[0]);
  for (const tag of tags) {
    const found = localeFromBrowser(tag);
    const code = tag.toLowerCase().split("-")[0];
    if (isLocale(code)) return found;
  }
  return DEFAULT_LOCALE;
}
