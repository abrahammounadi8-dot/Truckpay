"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useT } from "@/components/language-provider";
import { localeMeta, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function hidePopover(id: string) {
  const menu = document.getElementById(id);
  if (menu && "hidePopover" in menu) {
    (menu as HTMLElement & { hidePopover: () => void }).hidePopover();
  }
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();
  const pathname = usePathname() || "/";
  const popoverId = compact ? "language-menu-compact" : "language-menu-full";

  function pick(event: MouseEvent<HTMLAnchorElement>, next: Locale) {
    event.preventDefault();
    setLocale(next);
    hidePopover(popoverId);
  }

  return (
    <div className={cn("relative", !compact && "w-full")}>
      <button
        type="button"
        id={compact ? "language-switcher" : "language-switcher-menu"}
        popoverTarget={popoverId}
        {...{ popovertarget: popoverId }}
        aria-label={t("language.label")}
        className={cn(
          "inline-flex items-center justify-between gap-1.5 rounded-md border border-primary-foreground/40 bg-primary-foreground text-primary shadow-sm",
          "font-medium hover:bg-white",
          compact ? "h-8 max-w-[12rem] px-2 text-xs" : "h-10 w-full px-3 text-sm",
        )}
      >
        <span>{localeMeta[locale].nativeName}</span>
        <ChevronDownIcon className="size-3.5 opacity-80" aria-hidden />
      </button>
      <div
        id={popoverId}
        popover="auto"
        data-language-menu=""
        className="inset-auto top-16 right-3 left-3 m-0 mx-auto w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-white p-2 text-foreground shadow-2xl sm:right-4 sm:left-auto sm:mx-0"
      >
        <p className="px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("language.label")}
        </p>
        <div className="flex flex-col">
          {locales.map((code) => (
            <a
              key={code}
              href={`/api/locale?lang=${code}&next=${encodeURIComponent(pathname)}`}
              onClick={(event) => pick(event, code)}
              className={cn(
                "flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                code === locale && "bg-muted font-semibold",
              )}
            >
              <span>{localeMeta[code].nativeName}</span>
              {code === locale ? <CheckIcon className="size-3.5" aria-hidden /> : null}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
