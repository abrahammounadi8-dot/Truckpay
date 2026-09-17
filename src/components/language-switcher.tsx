"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useT } from "@/components/language-provider";
import { localeMeta, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const listId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  function pick(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div className={cn("relative", !compact && "w-full")}>
      <button
        type="button"
        id="language-switcher"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("language.label")}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center justify-between gap-1.5 rounded-md border border-primary-foreground/40 bg-primary-foreground text-primary shadow-sm",
          "font-medium hover:bg-white",
          compact ? "h-8 max-w-[12rem] px-2 text-xs" : "h-10 w-full px-3 text-sm",
        )}
      >
        <span>{localeMeta[locale].nativeName}</span>
        <ChevronDownIcon className="size-3.5 opacity-80" aria-hidden />
      </button>
      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[2147483646]" data-language-menu="">
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label={t("nav.closeMenu")}
                onClick={() => setOpen(false)}
              />
              <div
                id={listId}
                role="dialog"
                aria-label={t("language.label")}
                className="absolute top-16 right-3 left-3 z-[2147483647] mx-auto w-auto max-w-xs rounded-xl border border-border bg-white p-2 text-foreground shadow-2xl sm:right-4 sm:left-auto sm:w-64"
              >
                <p className="px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t("language.label")}
                </p>
                <div role="listbox" aria-label={t("language.label")} className="flex flex-col">
                  {locales.map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="option"
                      aria-selected={code === locale}
                      onClick={() => pick(code)}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                        code === locale && "bg-muted font-semibold",
                      )}
                    >
                      <span>{localeMeta[code].nativeName}</span>
                      {code === locale ? <CheckIcon className="size-3.5" aria-hidden /> : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
