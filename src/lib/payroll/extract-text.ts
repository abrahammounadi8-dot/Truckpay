import { resolveEmployer } from "@/lib/payroll/employer";
import type { PayFrequency, PayslipInput } from "@/lib/payroll/types";

export type ExtractedPayslipDraft = {
  fields: Partial<PayslipInput>;
  deductions: { rawLabel: string; amount: number }[];
  allowances: { rawLabel: string; amount: number }[];
  filledKeys: string[];
};

/**
 * Map labelled payslip text to fields. Never invent a value that is not clearly present.
 * TEST / synthetic text only belongs in automated tests.
 */
export function extractFromPayslipText(raw: string): ExtractedPayslipDraft {
  const text = redactIdentifiers(raw).replace(/\u00a0/g, " ");
  const fields: ExtractedPayslipDraft["fields"] = {};
  const filledKeys: string[] = [];

  function set(key: keyof PayslipInput, value: PayslipInput[keyof PayslipInput] | null | undefined) {
    if (value == null || value === "") return;
    (fields as Record<string, unknown>)[key] = value;
    filledKeys.push(String(key));
  }

  set("paymentDate", firstDate(text, /(?:payment\s*date|pay\s*date|date\s*paid|paid\s*date)\s*[:.]?\s*([0-9]{1,4}[/-][0-9]{1,2}[/-][0-9]{2,4})/i));
  set("payPeriodStart", firstDate(text, /(?:period\s*start|from|pay\s*period\s*start|start\s*date)\s*[:.]?\s*([0-9]{1,4}[/-][0-9]{1,2}[/-][0-9]{2,4})/i));
  set("payPeriodEnd", firstDate(text, /(?:period\s*end|to|pay\s*period\s*end|end\s*date)\s*[:.]?\s*([0-9]{1,4}[/-][0-9]{1,2}[/-][0-9]{2,4})/i));

  const periodRange = text.match(
    /(?:pay\s*period|period)\s*[:.]?\s*([0-9]{1,4}[/-][0-9]{1,2}[/-][0-9]{2,4})\s*(?:to|-|–)\s*([0-9]{1,4}[/-][0-9]{1,2}[/-][0-9]{2,4})/i,
  );
  if (periodRange) {
    set("payPeriodStart", toIsoDate(periodRange[1]!));
    set("payPeriodEnd", toIsoDate(periodRange[2]!));
  }

  const week = text.match(/\b(?:week|wk|tax\s*week)\s*(?:no\.?|number|#)?\s*[:.]?\s*(\d{1,2})\b/i);
  if (week) {
    const n = Number(week[1]);
    if (Number.isInteger(n) && n >= 1 && n <= 53) set("weekNumber", n);
  }

  const frequency = detectFrequency(text);
  if (frequency) set("payFrequency", frequency);

  set("employmentWeeks", labeledNumber(text, /(?:insurable\s*weeks|employment\s*weeks)\s*[:.]?\s*([\d.,]+)/i, 400));
  set("basicHours", labeledNumber(text, /(?:basic\s*hours|ordinary\s*hours)\s*[:.]?\s*([\d.,]+)/i, 400));
  set("overtimeHours", labeledNumber(text, /(?:overtime\s*hours|ot\s*hours)\s*[:.]?\s*([\d.,]+)/i, 400));
  set("basicRate", labeledMoney(text, /(?:basic\s*(?:hourly\s*)?rate|hourly\s*rate)\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("overtimeRate", labeledMoney(text, /(?:overtime\s*rate|ot\s*rate)\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("basicPay", labeledMoney(text, /(?:basic\s*pay|ordinary\s*pay)\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("overtimePay", labeledMoney(text, /(?:overtime\s*pay|ot\s*pay)\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("holidayPay", labeledMoney(text, /(?:holiday\s*pay|annual\s*leave\s*pay)\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("grossPay", labeledMoney(text, /\bgross\s*pay\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("netPay", labeledMoney(text, /\bnet\s*pay\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("cumulativeGross", labeledMoney(text, /(?:ytd|year[\s-]*to[\s-]*date|cumulative)\s*gross\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("cumulativeTax", labeledMoney(text, /(?:ytd|year[\s-]*to[\s-]*date|cumulative)\s*(?:tax|paye)\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("cumulativePrsi", labeledMoney(text, /(?:ytd|year[\s-]*to[\s-]*date|cumulative)\s*prsi\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("cumulativeUsc", labeledMoney(text, /(?:ytd|year[\s-]*to[\s-]*date|cumulative)\s*usc\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("cumulativePension", labeledMoney(text, /(?:ytd|year[\s-]*to[\s-]*date|cumulative)\s*pension\s*[:.]?\s*€?\s*([\d,]+(?:\.\d{1,2})?)/i));
  set("totalInsurableWeeks", labeledNumber(text, /(?:ytd|year[\s-]*to[\s-]*date|total)\s*insurable\s*weeks\s*[:.]?\s*([\d.,]+)/i, 400));

  const employerLine = text.match(/\bemployer\s*[:.]?\s*([^\n]+)/i);
  if (employerLine) {
    const employer = resolveEmployer(employerLine[1]);
    set("employerName", employer.employerName);
    set("employerSlug", employer.employerSlug);
  }

  const deductions = collectLines(text, [
    { label: "PAYE", pattern: /\bpaye\b[^0-9€]{0,20}€?\s*([\d,]+(?:\.\d{1,2})?)/i },
    { label: "PRSI", pattern: /\bprsi\b[^0-9€]{0,20}€?\s*([\d,]+(?:\.\d{1,2})?)/i },
    { label: "USC", pattern: /\busc\b[^0-9€]{0,20}€?\s*([\d,]+(?:\.\d{1,2})?)/i },
    { label: "Pension", pattern: /\bpension\b[^0-9€]{0,20}€?\s*([\d,]+(?:\.\d{1,2})?)/i },
  ]);

  return {
    fields,
    deductions,
    allowances: [],
    filledKeys,
  };
}

function redactIdentifiers(text: string): string {
  return text
    .replace(/\b\d{7}[A-Za-z]{1,2}\b/g, "[redacted]")
    .replace(/\b(?:ppsn|licence|license|employee\s*(?:no|number|id))\s*[:.]?\s*\S+/gi, "[redacted]");
}

function firstDate(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? toIsoDate(match[1]!) : null;
}

function toIsoDate(raw: string): string | null {
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const ie = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ie) {
    const day = ie[1]!.padStart(2, "0");
    const month = ie[2]!.padStart(2, "0");
    const year = ie[3]!;
    const iso = `${year}-${month}-${day}`;
    if (Date.parse(iso)) return iso;
  }
  return null;
}

function labeledMoney(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  return parseEuro(match[1]!);
}

function labeledNumber(text: string, pattern: RegExp, max: number): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = parseEuro(match[1]!);
  if (value == null || value > max) return null;
  return value;
}

function parseEuro(raw: string): number | null {
  const trimmed = raw.replace(/[€\s]/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.includes(",") && trimmed.includes(".")
    ? trimmed.replace(/,/g, "")
    : trimmed.includes(",") && !trimmed.includes(".")
      ? trimmed.replace(",", ".")
      : trimmed;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function detectFrequency(text: string): PayFrequency | null {
  if (/\bfortnightly\b/i.test(text)) return "fortnightly";
  if (/\blunar\b/i.test(text)) return "lunar";
  if (/\bmonthly\b/i.test(text)) return "monthly";
  if (/\bweekly\b/i.test(text)) return "weekly";
  return null;
}

function collectLines(text: string, rules: { label: string; pattern: RegExp }[]) {
  const lines: { rawLabel: string; amount: number }[] = [];
  for (const rule of rules) {
    const amount = labeledMoney(text, rule.pattern);
    if (amount == null) continue;
    lines.push({ rawLabel: rule.label, amount });
  }
  return lines;
}
