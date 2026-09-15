"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { useT } from "@/components/language-provider";
import { localeMeta, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", !compact && "w-full")}>
      <button
        type="button"
        id="language-switcher"
        aria-label={t("language.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={
          compact
            ? "inline-flex h-8 max-w-[11rem] items-center gap-1 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-2 text-xs font-medium text-primary-foreground"
            : "inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-2 text-sm font-medium text-primary-foreground"
        }
      >
        <span>{localeMeta[locale].nativeName}</span>
        <ChevronDownIcon className="size-3.5 opacity-80" aria-hidden />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("language.label")}
          className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-md border border-border bg-card py-1 text-foreground shadow-lg"
        >
          {locales.map((code) => (
            <li key={code} role="none">
              <button
                type="button"
                role="option"
                aria-selected={code === locale}
                data-locale={code}
                onClick={() => pick(code)}
                className={cn(
                  "flex w-full px-3 py-1.5 text-left text-sm hover:bg-muted",
                  code === locale && "bg-muted font-medium",
                )}
              >
                {localeMeta[code].nativeName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
