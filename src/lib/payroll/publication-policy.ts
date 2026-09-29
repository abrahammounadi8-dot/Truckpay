/** Internal disclosure-review preparation. Never return this result from a public route.
 * This is not an anonymisation guarantee and cannot authorise publication.
 */
import { createHash } from "node:crypto";
import { analyseLatestSet } from "./analysis";
import { median } from "./weekly";
import { employmentStartFor, profileAtPayslip, validateEmploymentStart } from "./employment-month";
import type { EmploymentProfile, Payslip, TenureBand } from "./types";

export const PUBLICATION_POLICY = Object.freeze({
  version: "salary-tenure-intervals-v1-draft",
  noticeVersion: "salary-tenure-intervals-v1-draft",
  minimumPeoplePerCell: 10,
  intervalEuros: 100,
  minimumPayslipsPerPerson: 3,
});

const frequencies = ["weekly", "fortnightly", "monthly"] as const;
const bands: readonly TenureBand[] = ["0_1", "1_3", "3_5", "5_plus"];
type Frequency = typeof frequencies[number];
export type PublicationPeriod = { start: string; end: string };
/** Issued by a trusted identity review, never by a form, cookie or payroll payload.
 * A verified email alone is not evidence of a distinct person.
 */
export type ReviewedPerson = { userId: string; personKey: string };
export type ReleaseHistory = {
  employerSlug: string;
  period: PublicationPeriod;
  personKeys: readonly string[];
};
type ProposedCell = {
  metric: "net_per_payslip";
  frequency: Frequency;
  tenureBand: TenureBand;
  medianIntervalEUR: { fromInclusive: number; toExclusive: number };
};
export type PublicationProposal = {
  policyVersion: string;
  employerSlug: string;
  period: PublicationPeriod;
  currency: "EUR";
  cells: ProposedCell[];
};
export type PublicationInput = {
  employerSlug: string;
  /** Only the static public catalogue is allowed, never payroll-derived employers. */
  publicEmployerSlugs: readonly string[];
  period: PublicationPeriod;
  frozenAt: string;
  payslips: readonly Payslip[];
  profiles: readonly EmploymentProfile[];
  reviewedPeople: readonly ReviewedPerson[];
  /** Complete global history, including withdrawn releases, from a durable ledger. */
  history: readonly ReleaseHistory[];
};
export type PublicationReview = {
  status: "blocked" | "review_required";
  /** Always false: approval, durable ledger and a separate serving path are required. */
  publishable: false;
  blockers: string[];
  proposal: PublicationProposal | null;
  /** Internal only, never part of the proposed public representation. */
  audit: {
    fingerprint: string;
    personKeys: string[];
    cells: { frequency: Frequency; tenureBand: TenureBand; people: number; suppressed: boolean }[];
  };
};

const isoDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const isoInstant = (value: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const validPeriod = (p: PublicationPeriod) => isoDay(p.start) && isoDay(p.end) && p.start <= p.end;
const overlaps = (a: PublicationPeriod, b: PublicationPeriod) => a.start <= b.end && b.start <= a.end;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** One closed calendar quarter; no arbitrary dates or interactive small cohorts. */
function calendarQuarter(p: PublicationPeriod): boolean {
  if (!validPeriod(p) || !["01-01", "04-01", "07-01", "10-01"].includes(p.start.slice(5))) return false;
  const d = new Date(p.start);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 3, 0)).toISOString().slice(0, 10) === p.end;
}

export function preparePublicationReview(input: PublicationInput): PublicationReview {
  const blockers: string[] = [];
  const emptyAudit = { fingerprint: "", personKeys: [] as string[], cells: [] as PublicationReview["audit"]["cells"] };
  const blocked = (): PublicationReview => ({ status: "blocked", publishable: false, blockers, proposal: null, audit: emptyAudit });
  if (!input.publicEmployerSlugs.includes(input.employerSlug)) blockers.push("employer_not_in_public_catalogue");
  if (!calendarQuarter(input.period) || !isoInstant(input.frozenAt)
    || input.period.end >= input.frozenAt.slice(0, 10)) blockers.push("closed_calendar_quarter_required");
  if (input.history.some(h => !validPeriod(h.period) || !h.employerSlug || h.personKeys.some(k => !k.trim()))) blockers.push("invalid_release_history");
  if (input.history.some(h => h.employerSlug === input.employerSlug && overlaps(h.period, input.period))) blockers.push("period_already_released");
  if (blockers.length) return blocked();

  const profiles = new Map<string, EmploymentProfile[]>();
  for (const p of input.profiles) profiles.set(p.userId, [...(profiles.get(p.userId) ?? []), p]);
  const identities = new Map<string, string[]>();
  const accounts = new Map<string, Set<string>>();
  for (const p of input.reviewedPeople) {
    if (!p.userId.trim() || !p.personKey.trim()) continue;
    identities.set(p.userId, [...(identities.get(p.userId) ?? []), p.personKey]);
    accounts.set(p.personKey, new Set([...(accounts.get(p.personKey) ?? []), p.userId]));
  }
  const usedPeople = new Set(input.history.flatMap(h => [...h.personKeys]));
  const contributions: { personKey: string; frequency: Frequency; tenureBand: TenureBand; value: number; consentAt: string; employmentHash: string; documentHashes: string[] }[] = [];
  for (const [userId, keys] of identities) {
    // Ambiguous identity mappings, multiple accounts or duplicate profiles fail closed.
    if (keys.length !== 1 || accounts.get(keys[0])?.size !== 1 || usedPeople.has(keys[0])) continue;
    const records = profiles.get(userId);
    if (records?.length !== 1) continue;
    const consent = records[0].statisticsSharing;
    if (consent?.enabled !== true || consent.noticeVersion !== PUBLICATION_POLICY.noticeVersion
      || !isoInstant(consent.updatedAt) || consent.updatedAt > input.frozenAt) continue;
    const slips = input.payslips.filter(s => s.userId === userId && s.employerSlug === input.employerSlug
      && s.countryCode === "IE" && s.currency === "EUR" && !s.manualAmountAudit
      && isoDay(s.paymentDate) && s.paymentDate >= input.period.start && s.paymentDate <= input.period.end
      && isoInstant(s.createdAt) && s.createdAt <= input.frozenAt);
    // Select the same three consecutive documents as private analysis. All three must
    // have valid native net amounts; missing fields cannot quietly shrink the sample.
    const analysis = analyseLatestSet(slips, null);
    const selected = analysis.latest;
    if (analysis.status !== "verified" || selected.length !== PUBLICATION_POLICY.minimumPayslipsPerPerson) continue;
    const declaration = employmentStartFor(records[0], input.employerSlug);
    if (!declaration || validateEmploymentStart(declaration.startMonth, input.employerSlug, slips, undefined, input.frozenAt.slice(0, 7))) continue;
    const tenureBand = profileAtPayslip(records[0], selected[0])?.tenureBand;
    // No cross-band contribution: exclude a sequence straddling a tenure boundary.
    if (!tenureBand || selected.some(s => profileAtPayslip(records[0], s)?.tenureBand !== tenureBand)) continue;
    const frequency = selected[0].payFrequency;
    if (!frequencies.includes(frequency as Frequency) || selected.some(s => s.payFrequency !== frequency)) continue;
    if (selected.some(s => s.netPay == null || !Number.isFinite(s.netPay) || s.netPay < 0)) continue;
    const value = median(selected.map(s => s.netPay!));
    if (value == null || !Number.isFinite(value)) continue;
    contributions.push({ personKey: keys[0], frequency: frequency as Frequency, tenureBand, value,
      consentAt: consent.updatedAt,
      employmentHash: hash(declaration),
      documentHashes: selected.map(s => hash(s)).sort() });
  }
  contributions.sort((a, b) => a.personKey.localeCompare(b.personKey));
  const cells: ProposedCell[] = [];
  const auditCells: PublicationReview["audit"]["cells"] = [];
  const includedPeople: string[] = [];
  for (const frequency of frequencies) {
   for (const tenureBand of bands) {
    const people = contributions.filter(c => c.frequency === frequency && c.tenureBand === tenureBand);
    const suppressed = people.length < PUBLICATION_POLICY.minimumPeoplePerCell;
    auditCells.push({ frequency, tenureBand, people: people.length, suppressed });
    if (suppressed) continue;
    const centre = median(people.map(p => p.value))!;
    const from = Math.floor(centre / PUBLICATION_POLICY.intervalEuros) * PUBLICATION_POLICY.intervalEuros;
    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(from + PUBLICATION_POLICY.intervalEuros)) continue;
    cells.push({ metric: "net_per_payslip", frequency, tenureBand, medianIntervalEUR: { fromInclusive: from, toExclusive: from + PUBLICATION_POLICY.intervalEuros } });
    includedPeople.push(...people.map(p => p.personKey));
   }
  }
  const proposal: PublicationProposal | null = cells.length ? {
    policyVersion: PUBLICATION_POLICY.version, employerSlug: input.employerSlug,
    period: { ...input.period }, currency: "EUR", cells,
  } : null;
  if (!proposal) blockers.push("no_metric_meets_minimum");
  return { status: proposal ? "review_required" : "blocked", publishable: false, blockers, proposal,
    audit: { personKeys: includedPeople.sort(), cells: auditCells,
      fingerprint: hash({ policy: PUBLICATION_POLICY, employer: input.employerSlug, period: input.period,
        frozenAt: input.frozenAt, contributions, proposal,
        history: [...input.history].map(h => ({ ...h, personKeys: [...h.personKeys].sort() })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) }) } };
}

/** Re-read consent and documents before approval. A changed cohort or source invalidates
 * the review, even when rounded public intervals happen to be identical.
 */
export function reviewStillMatches(review: PublicationReview, current: PublicationInput): boolean {
  const next = preparePublicationReview(current);
  return review.status === "review_required" && next.status === "review_required"
    && review.audit.fingerprint === next.audit.fingerprint
    && JSON.stringify(review.proposal) === JSON.stringify(next.proposal)
    && JSON.stringify(review.audit.personKeys) === JSON.stringify(next.audit.personKeys);
}
