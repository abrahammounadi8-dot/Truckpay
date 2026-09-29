import { resolveEmployer } from "./employer";
import type { ExtractedPayslipDraft } from "./extract-text";

export type PositionedText = { str: string; x: number; y: number; width: number; height: number };
type Row = { y: number; items: PositionedText[] };
const key = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const text = (items: PositionedText[]) => {
  const ordered = [...items].sort((a, b) => a.x - b.x);
  return ordered.map((item, n) => {
    const previous = ordered[n - 1];
    const gap = previous ? item.x - previous.x - previous.width : 0;
    return (previous && gap > Math.min(item.height, previous.height) * 0.12 ? " " : "") + item.str;
  }).join("").trim();
};
const centre = (i: PositionedText) => i.x + i.width / 2;

/** Recognise the column-based Sage EMAIL PAYSLIP, never merge it with flat-text guesses. */
export function extractSagePage(source: PositionedText[]): ExtractedPayslipDraft | null {
  const items = source.filter(i => i.str.trim());
  const heights = items.map(i => i.height).filter(h => h > 0).sort((a, b) => a - b);
  const tolerance = Math.max(0.5, (heights[Math.floor(heights.length / 2)] ?? 8) * 0.35);
  const rows: Row[] = [];
  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    let row = rows.find(r => Math.abs(r.y - item.y) <= tolerance);
    if (!row) { row = { y: item.y, items: [] }; rows.push(row); }
    row.items.push(item);
  }
  // PDF generators may emit a heading as one item, words, or individual glyphs.
  const find = (label: string) => {
    const matches: PositionedText[] = [];
    for (const row of rows) {
      const ordered = [...row.items].sort((a, b) => a.x - b.x);
      for (let start = 0; start < ordered.length; start++) {
        let combined = "";
        for (let end = start; end < ordered.length; end++) {
          if (end > start && ordered[end].x - ordered[end - 1].x - ordered[end - 1].width > Math.max(ordered[end].height, 1) * 2) break;
          combined += key(ordered[end].str);
          if (!label.startsWith(combined)) break;
          if (combined === label) {
            matches.push({ ...ordered[start], str: label, width: ordered[end].x + ordered[end].width - ordered[start].x });
            break;
          }
        }
      }
    }
    return matches;
  };
  if (!find("PAYMENTDETAILS").length || !find("DEDUCTIONDETAILS").length || !find("CUMULATIVEDETAILS").length) return null;
  const draft: ExtractedPayslipDraft = { fields: {}, allowances: [], deductions: [], filledKeys: [] };
  const unique = (label: string) => find(label).length === 1 ? find(label)[0] : undefined;
  const current = unique("THISPERIOD"), balance = unique("BALANCE"), hours = unique("HOURS"), value = unique("VALUE");
  const descriptions = find("DESCRIPTION").sort((a, b) => a.x - b.x);
  const cumulative = unique("CUMULATIVEDETAILS");
  const net = [...find("NETPAY"), ...find("NETTPAY")].sort((a, b) => b.x - a.x)[0];
  if (!current || !balance || !hours || !value || !cumulative || !net || descriptions.length !== 2) return draft;
  const set = (name: keyof typeof draft.fields, v: string | number | null | undefined) => {
    if (v == null || v === "") return;
    Object.assign(draft.fields, { [name]: v });
  };
  const numeric = (list: PositionedText[]) => {
    const s = text(list.filter(i => !/^[TN]$/.test(i.str.trim()))).replace(/[€\s]/g, "");
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s)) return undefined;
    return Number(s.replace(/,/g, ""));
  };
  const rowOf = (item: PositionedText) => rows.find(r => Math.abs(r.y - item.y) <= tolerance)!;
  const rightOf = (label: PositionedText, stop = Infinity) => rowOf(label).items.filter(i => i.x >= label.x + label.width - tolerance && i.x < stop && i !== label);
  const payment = unique("PAYMENTDATE");
  if (payment) {
    const m = text(rightOf(payment)).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
      const d = new Date(iso);
      if (!Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === iso) set("paymentDate", iso);
    }
  }
  const frequency = unique("FREQUENCY");
  if (frequency) {
    const next = rightOf(frequency).sort((a, b) => a.x - b.x)[0];
    const f = next && ({ W: "weekly", F: "fortnightly", M: "monthly" } as const)[key(next.str) as "W" | "F" | "M"];
    if (f) set("payFrequency", f);
  }
  // PAY PERIOD is a payroll period identifier, not necessarily an ISO calendar week.
  const company = items.find(i => /^COMPANYREG(?:ISTRATION)?NUMBER/.test(key(i.str))) ?? unique("COMPANYREGNUMBER");
  if (company) {
    const name = text(rowOf(company).items.filter(i => i.x + i.width <= company.x - tolerance));
    if (name && !/\b(?:PPS|EMPLOYEE|EMP\.? NAME)\b/i.test(name)) {
      const employer = resolveEmployer(name);
      set("employerName", employer.employerName); set("employerSlug", employer.employerSlug);
    }
  }
  const deductionLeft = descriptions[1].x - tolerance;
  const currentLeft = (centre(descriptions[1]) + centre(current)) / 2;
  const balanceLeft = (centre(current) + centre(balance)) / 2;
  const summaryLeft = (centre(balance) + centre(net)) / 2;
  const hoursLeft = (centre(descriptions[0]) + centre(hours)) / 2;
  const valueLeft = (centre(hours) + centre(value)) / 2;
  const summaryRows = rows.filter(r => r.items.some(i => centre(i) > summaryLeft));
  for (const [label, field] of [["GROSSPAY", "grossPay"], ["NETPAY", "netPay"]] as const) {
    const headings = summaryRows.filter(r => {
      const heading = key(text(r.items.filter(i => centre(i) > summaryLeft)));
      return heading === label || (label === "NETPAY" && heading === "NETTPAY");
    });
    if (headings.length !== 1) continue;
    const index = summaryRows.indexOf(headings[0]);
    set(field, numeric(summaryRows[index + 1]?.items.filter(i => centre(i) > summaryLeft) ?? []));
  }
  let employerContribution = false;
  const seenPayments = new Set<string>(), seenDeductions = new Set<string>();
  for (const row of rows.filter(r => r.y < current.y - tolerance && r.y > cumulative.y + tolerance)) {
    const paymentLabel = text(row.items.filter(i => centre(i) < hoursLeft && i.x < deductionLeft));
    const paymentKey = key(paymentLabel).replace(/[TN]$/, "");
    const amount = numeric(row.items.filter(i => centre(i) >= valueLeft && i.x < deductionLeft));
    const h = numeric(row.items.filter(i => centre(i) >= hoursLeft && centre(i) < valueLeft));
    if (amount != null && paymentLabel && !seenPayments.has(paymentKey)) {
      seenPayments.add(paymentKey);
      if (/^BASIC(?:PAY)?$/.test(paymentKey)) { set("basicPay", amount); set("basicHours", h); }
      else if (/^(?:OVERTIME|OT)(?:PAY)?$/.test(paymentKey)) { set("overtimePay", amount); set("overtimeHours", h); }
      else if (/^HOLIDAY(?:PAY)?$/.test(paymentKey)) set("holidayPay", amount);
      else if (/^(?:MISCEXP|SUBSISTUNV|SUBSISTENCE|EXPENSES)$/.test(paymentKey)) {
        draft.allowances.push({ rawLabel: paymentLabel.replace(/\s+[TN]$/, ""), amount });
      }
    }
    const deductionLabel = text(row.items.filter(i => i.x >= deductionLeft && i.x < currentLeft));
    if (/EMPLOYER.*(?:PENSION|CONTRIBUTION)/i.test(deductionLabel)) employerContribution = true;
    if (employerContribution) continue;
    const dkey = key(deductionLabel).replace(/T$/, "");
    const canonical = ({ PAYE: "PAYE", PRSI: "PRSI", USC: "USC", AEPENSION: "AE Pension", PENSION: "Pension" } as Record<string, string>)[dkey];
    if (!canonical || seenDeductions.has(canonical)) continue;
    seenDeductions.add(canonical);
    const period = numeric(row.items.filter(i => centre(i) >= currentLeft && centre(i) < balanceLeft));
    const ytd = numeric(row.items.filter(i => centre(i) >= balanceLeft && centre(i) < summaryLeft));
    if (period != null) draft.deductions.push({ rawLabel: canonical, amount: period });
    const cumulativeFields: Record<string, keyof typeof draft.fields> = { PAYE: "cumulativeTax", PRSI: "cumulativePrsi", USC: "cumulativeUsc", "AE Pension": "cumulativePension", Pension: "cumulativePension" };
    const field = cumulativeFields[canonical];
    if (field) set(field, ytd);
  }
  for (const row of rows.filter(r => r.y < cumulative.y - tolerance)) {
    const left = row.items.filter(i => i.x < hoursLeft);
    if (key(text(left)) === "GROSSPAY") set("cumulativeGross", numeric(row.items.filter(i => centre(i) >= hoursLeft && centre(i) < valueLeft)));
  }
  draft.filledKeys = Object.keys(draft.fields);
  return draft;
}
