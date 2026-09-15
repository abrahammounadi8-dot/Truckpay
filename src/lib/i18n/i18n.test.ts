import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dictionaries } from "./dictionaries";
import { locales, localeFromRequest } from "./config";
import { flattenKeys, interpolate } from "./lookup";
import { persistLocale, readStoredLocale } from "./persist";

describe("i18n dictionaries", () => {
  const englishKeys = flattenKeys(dictionaries.en).sort();

  it("keeps the same keys in every language", () => {
    for (const locale of locales) {
      assert.deepEqual(flattenKeys(dictionaries[locale]).sort(), englishKeys, locale);
    }
  });

  it("has no empty strings", () => {
    for (const locale of locales) {
      for (const key of flattenKeys(dictionaries[locale])) {
        const value = key.split(".").reduce<unknown>((acc, part) => {
          return acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined;
        }, dictionaries[locale]);
        assert.equal(typeof value, "string", `${locale}.${key}`);
        assert.ok(String(value).length > 0, `${locale}.${key}`);
      }
    }
  });

  it("interpolates placeholders", () => {
    assert.equal(interpolate("{have} of {need}", { have: 1, need: 3 }), "1 of 3");
    assert.equal(interpolate("week {n}", { n: 12 }), "week 12");
  });

  it("picks language from cookie, then Accept-Language", () => {
    assert.equal(localeFromRequest("es", "pl,en"), "es");
    assert.equal(localeFromRequest(undefined, "pt-PT,en;q=0.8"), "pt");
    assert.equal(localeFromRequest(undefined, "pl-PL"), "pl");
    assert.equal(localeFromRequest(undefined, "lt-LT,en"), "lt");
    assert.equal(localeFromRequest(undefined, "ro-RO"), "ro");
    assert.equal(localeFromRequest(undefined, "ru-RU,en;q=0.8"), "ru");
    assert.equal(localeFromRequest(undefined, "fr-FR,en-IE"), "en");
    assert.equal(localeFromRequest("nope", null), "en");
  });
});

describe("i18n persist", () => {
  it("stores the language in a cookie and localStorage", () => {
    const store: Record<string, string> = {};
    const html = { lang: "" };
    globalThis.document = {
      cookie: "",
      documentElement: html,
    } as Document;
    globalThis.window = {
      localStorage: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
      },
    } as Window & typeof globalThis;

    persistLocale("ru");
    assert.match(String(document.cookie), /tp_lang=ru/);
    assert.equal(html.lang, "ru");
    assert.equal(readStoredLocale(), "ru");
  });
});
