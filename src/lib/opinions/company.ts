import { createHash } from 'node:crypto';
import type { OpinionInput } from './input';
export type OpinionCompany = {slug:string;name:string};
export function companyNameKey(name:string) { return name.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase(); }
/** New names stay in the moderated opinions area, not the payroll directory. */
export function resolveOpinionCompany(input:OpinionInput, companies:OpinionCompany[]):OpinionCompany|null {
 if (input.kind !== 'company') return null;
 if (input.companySlug) return companies.find(c=>c.slug===input.companySlug) ?? null;
 if (!input.companyName) return null;
 const key=companyNameKey(input.companyName);
 return companies.find(c=>companyNameKey(c.name)===key) ?? {
   slug:'review-'+createHash('sha256').update(key).digest('hex'), name:input.companyName,
 };
}
