import { REQUIRED_PAYSLIPS, type Payslip } from "./types";

const day = (value: string | null) => value ? Date.parse(value) / 86400000 : NaN;
type SequenceSlip = Omit<Payslip, "userId">;
type SupportedFrequency = "weekly" | "fortnightly" | "monthly";
const month = (value: string) => {
  const date = new Date(value);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
};
const printedPeriod = (s: SequenceSlip, frequency: SupportedFrequency) => {
  const start = day(s.payPeriodStart), end = day(s.payPeriodEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  if (frequency !== "monthly") return end - start === (frequency === "weekly" ? 6 : 13);
  const date = new Date(s.payPeriodStart!);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0)).getUTCDate();
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, Math.min(date.getUTCDate(), lastDay)) / 86400000;
  return end + 1 === next;
};
const frequencyOf = (s: SequenceSlip): SupportedFrequency | null => {
  if (s.payFrequency === "weekly" || s.payFrequency === "fortnightly" || s.payFrequency === "monthly") return s.payFrequency;
  if (s.payFrequency !== "unknown") return null;
  return (["weekly", "fortnightly", "monthly"] as const).find(f => printedPeriod(s, f)) ?? null;
};

/** Payment cadence is evidence of a sequence, never an assignment of worked dates. */
export function consecutiveOnboarding<T extends SequenceSlip>(all: T[]) {
  const unique = [...new Map(all.map(s => [s.contentHash || s.id, s])).values()];
  const groups = new Map<string, { frequency: SupportedFrequency; slips: T[] }>();
  for (const slip of unique) {
    if (slip.manualAmountAudit) continue;
    const frequency = frequencyOf(slip);
    if (!slip.employerSlug || !frequency || !Number.isFinite(day(slip.paymentDate))) continue;
    if (![slip.grossPay, slip.netPay, slip.basicPay].some(v => v != null && Number.isFinite(v))) continue;
    // Explicit periods take precedence over a frequency label or payment cadence.
    if (slip.payPeriodStart && slip.payPeriodEnd && !printedPeriod(slip, frequency)) continue;
    const key = [slip.countryCode, slip.currency, slip.employerSlug, frequency].join(":");
    const group = groups.get(key) ?? { frequency, slips: [] };
    group.slips.push(slip);
    groups.set(key, group);
  }
  const gaps: Record<string, SupportedFrequency> = {};
  let best: T[] = [];
  let bestFrequency: SupportedFrequency | null = null;
  for (const { slips, frequency } of groups.values()) {
    const ordered = slips.sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    let run: T[] = [];
    for (const slip of ordered) {
      const previous = run.at(-1);
      const bothPeriods = previous && printedPeriod(previous, frequency) && printedPeriod(slip, frequency);
      const cadence = previous && previous.payFrequency === frequency && slip.payFrequency === frequency && (frequency === "monthly"
        ? month(slip.paymentDate) - month(previous.paymentDate) === 1
        : day(slip.paymentDate) - day(previous.paymentDate) === (frequency === "weekly" ? 7 : 14));
      const adjacent = previous && (bothPeriods ? day(slip.payPeriodStart) - day(previous.payPeriodEnd) === 1 : cadence);
      const gap = previous && !adjacent && (bothPeriods
        ? day(slip.payPeriodStart) - day(previous.payPeriodEnd) > 1
        : previous.payFrequency === frequency && slip.payFrequency === frequency && (frequency === "monthly"
          ? month(slip.paymentDate) - month(previous.paymentDate) > 1
          : day(slip.paymentDate) - day(previous.paymentDate) > (frequency === "weekly" ? 7 : 14)));
      if (gap) { gaps[previous.id] = frequency; gaps[slip.id] = frequency; }
      run = adjacent ? [...run, slip] : [slip];
      if (run.length > best.length) { best = run; bestFrequency = frequency; }
    }
  }
  return {
    unlocked: best.length >= REQUIRED_PAYSLIPS,
    have: Math.min(best.length, REQUIRED_PAYSLIPS),
    required: REQUIRED_PAYSLIPS,
    needsDetails: unique.length > best.length && best.length < REQUIRED_PAYSLIPS,
    inferred: best.length > 0 && !best.every(s => printedPeriod(s, bestFrequency!)),
    slips: best,
    gaps,
  };
}
