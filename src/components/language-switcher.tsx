"use client";

import { useT } from "@/components/language-provider";
import { localeMeta, locales, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();

  return (
    <label className="inline-flex items-center gap-2">
      {compact ? null : (
        <span className="sr-only">{t("language.label")}</span>
      )}
      <select
        aria-label={t("language.label")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={
          compact
            ? "h-8 max-w-[11rem] rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-2 text-xs font-medium text-primary-foreground"
            : "h-9 w-full rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-2 text-sm font-medium text-primary-foreground"
        }
      >
        {locales.map((code) => (
          <option key={code} value={code} className="text-foreground">
            {localeMeta[code].nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
