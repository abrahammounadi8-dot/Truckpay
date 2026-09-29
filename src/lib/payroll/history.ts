import { fleet } from "@/lib/data";
import { employerLabel } from "./employer";

type HistorySlip = { id: string; employerName: string | null; employerSlug: string | null; paymentDate: string };

/** Presentation grouping only. Eligibility remains owned by the server. */
export function groupPayslipsByEmployer<T extends HistorySlip>(slips: readonly T[]) {
  const groups = new Map<string, { key: string; label: string | null; slips: T[]; firstPaymentDate: string; lastPaymentDate: string }>();
  for (const slip of [...slips].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))) {
    const name = slip.employerName?.trim() ?? "";
    const slug = slip.employerSlug?.trim() ?? "";
    const normalized = name.toLowerCase();
    // Only explicit directory aliases establish equivalence, never a generated slug.
    const known = fleet.find(company => [company.slug, company.name, company.shortName].some(alias => alias.toLowerCase() === normalized));
    const knownSlugOnly = !name && fleet.find(company => company.slug === slug);
    const canonical = known && (!slug || slug === known.slug) ? known : knownSlugOnly;
    // Keep punctuation, diacritics and conflicting slugs: slugification is lossy.
    // Unknown slug-only records cannot safely identify the same employer.
    const key = canonical ? JSON.stringify(["known", canonical.slug])
      : name ? JSON.stringify(["named", normalized, slug]) : JSON.stringify(["unresolved", slip.id]);
    let group = groups.get(key);
    if (!group) {
      group = { key, label: canonical ? canonical.name : employerLabel({ employerName: name, employerSlug: slug }), slips: [], firstPaymentDate: slip.paymentDate, lastPaymentDate: slip.paymentDate };
      groups.set(key, group);
    }
    group.slips.push(slip);
    group.firstPaymentDate = slip.paymentDate;
  }
  return [...groups.values()];
}

/** Sum net in cents; do not substitute gross or combine currencies. */
export function employerNetTotals(slips: readonly { id: string; currency: string; netPay: number | null }[]) {
 const totals=new Map<string,{currency:string;cents:number;counted:number;missing:number}>();const seen=new Set<string>();
 for(const slip of slips){if(seen.has(slip.id))continue;seen.add(slip.id);
 const total=totals.get(slip.currency)??{currency:slip.currency,cents:0,counted:0,missing:0};
 if(slip.netPay!=null && Number.isFinite(slip.netPay)){total.cents+=Math.round(slip.netPay*100);total.counted++;}else total.missing++;
 totals.set(slip.currency,total);}
 return [...totals.values()].map(({cents,...total})=>({...total,amount:total.counted?cents/100:null}));
}
