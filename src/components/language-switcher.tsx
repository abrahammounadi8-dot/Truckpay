"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/language-provider";
import { localeMeta, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useT();
  const pathname = usePathname() || "/";

  function pick(event: MouseEvent<HTMLAnchorElement>, next: Locale) {
    event.preventDefault();
    setLocale(next);
  }

  return (
    <nav
      id="language-switcher"
      aria-label={t("language.label")}
      className="border-t border-primary-foreground/15 bg-primary"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-1 px-4 py-1.5">
        <span className="mr-1 text-[0.65rem] font-semibold tracking-[0.16em] text-primary-foreground/55 uppercase">
          {t("language.label")}
        </span>
        {locales.map((code) => (
          <a
            key={code}
            href={`/api/locale?lang=${code}&next=${encodeURIComponent(pathname)}`}
            onClick={(event) => pick(event, code)}
            aria-current={code === locale ? "true" : undefined}
            lang={localeMeta[code].htmlLang}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              code === locale
                ? "bg-primary-foreground text-primary"
                : "text-primary-foreground/80 hover:bg-primary-foreground/12 hover:text-primary-foreground",
            )}
          >
            {localeMeta[code].nativeName}
          </a>
        ))}
      </div>
    </nav>
  );
}
