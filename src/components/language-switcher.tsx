"use client";

import { useRef, type MouseEvent } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/language-provider";
import { localeMeta, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useT();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname() || "/";

  function pick(event: MouseEvent<HTMLAnchorElement>, next: Locale) {
    event.preventDefault();
    setLocale(next);
    if (disclosure.current) {
      disclosure.current.open = false;
      disclosure.current.querySelector("summary")?.focus();
    }
  }

  return (
    <nav
      id="language-switcher"
      aria-label={t("language.label")}
      className="border-t border-primary-foreground/15 bg-primary"
    >
      <details ref={disclosure} className="group mx-auto w-full max-w-6xl px-4" onKeyDown={event => {
        if (event.key === "Escape" && disclosure.current) { disclosure.current.open = false; disclosure.current.querySelector("summary")?.focus(); }
      }}>
        <summary className="flex min-h-10 w-fit cursor-pointer list-none items-center gap-2 rounded-md py-2 text-xs font-medium text-primary-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
          <Globe className="size-4" aria-hidden="true" />
          <span>{t("language.label")} · {localeMeta[locale].nativeName}</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="flex flex-wrap items-center gap-1 pb-3">
        {locales.map((code) => (
          <a
            key={code}
            href={`/api/locale?lang=${code}&next=${encodeURIComponent(pathname)}`}
            onClick={(event) => pick(event, code)}
            aria-current={code === locale ? "true" : undefined}
            lang={localeMeta[code].htmlLang}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium",
              code === locale
                ? "bg-primary-foreground text-primary"
                : "text-primary-foreground/80 hover:bg-primary-foreground/12 hover:text-primary-foreground",
            )}
          >
            {localeMeta[code].nativeName}
          </a>
        ))}
        </div>
      </details>
    </nav>
  );
}
