import type { Messages } from "./en";
import type { PayFrequency } from "@/lib/payroll/types";

export type MessageKey = Leaves<Messages>;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export function getByPath(messages: Messages, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);
  return typeof value === "string" ? value : path;
}

export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    vars[key] != null ? String(vars[key]) : match,
  );
}

export function flattenKeys(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return prefix ? [prefix] : [];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  );
}

export function frequencyMessageKey(freq: PayFrequency): MessageKey {
  switch (freq) {
    case "weekly":
      return "form.freqWeekly";
    case "fortnightly":
      return "form.freqFortnightly";
    case "lunar":
      return "form.freqLunar";
    case "monthly":
      return "form.freqMonthly";
    default:
      return "form.freqUnknown";
  }
}
