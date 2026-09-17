"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  dictionaries,
  getByPath,
  interpolate,
  isLocale,
  persistLocale,
  readStoredLocale,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";

import { translateUi } from "@/lib/i18n/ui-copy";

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    persistLocale(next);
    setLocaleState(next);
    // Client copy updates immediately. Refresh server components after the
    // picker has closed so the overlay is not torn down mid-click.
    window.setTimeout(() => router.refresh(), 0);
  }, [router]);

  useEffect(() => {
    const stored = readStoredLocale();
    const next = stored ?? initialLocale;
    /* eslint-disable react-hooks/set-state-in-effect -- restore cookie/localStorage after mount */
    setLocaleState(next);
    /* eslint-enable react-hooks/set-state-in-effect */
    persistLocale(next);
  }, [initialLocale]);

  const t = useCallback<Translate>(
    (key, vars) => interpolate(getByPath(dictionaries[locale], key), vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used within LanguageProvider");
  return ctx;
}

export function useUiCopy() {
  const { locale } = useT();
  return useCallback((text: string, vars?: Record<string, string | number>) => translateUi(locale, text, vars), [locale]);
}
