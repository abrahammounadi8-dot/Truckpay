"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useT } from "@/components/language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeMeta, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();

  function pick(next: Locale) {
    setLocale(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language.label")}
        className={
          compact
            ? "inline-flex h-8 max-w-[12rem] items-center gap-1 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-2 text-xs font-medium text-primary-foreground hover:bg-primary-foreground/16"
            : "inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-2 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/16"
        }
      >
        <span>{localeMeta[locale].nativeName}</span>
        <ChevronDownIcon className="size-3.5 opacity-80" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="z-[80] min-w-44">
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            data-locale={code}
            onClick={() => pick(code)}
            className={cn(code === locale && "font-medium")}
          >
            <span className="flex-1">{localeMeta[code].nativeName}</span>
            {code === locale ? <CheckIcon className="size-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
