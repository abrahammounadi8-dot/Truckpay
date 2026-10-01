export const OPINION_CONSENT = 'opinions-2026-10-01';
export type OpinionInput = {
 id: string; kind: 'company' | 'platform'; companySlug: string | null;
 category: 'experience' | 'idea' | 'problem' | 'other'; rating: number | null; body: string;
};
export function parseOpinion(raw: unknown): OpinionInput | null {
 if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
 const r = raw as Record<string, unknown>;
 if (typeof r.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.id)) return null;
 if (r.kind !== 'company' && r.kind !== 'platform') return null;
 if (r.consent !== true || r.consentVersion !== OPINION_CONSENT) return null;
 if (typeof r.body !== 'string') return null;
 const body = r.body.trim();
 if (body.length < 20 || body.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body)) return null;
 const rating = r.rating === null || r.rating === undefined || r.rating === '' ? null : r.rating;
 if (rating !== null && (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5)) return null;
 if (r.kind === 'company') {
   if (typeof r.companySlug !== 'string' || !/^[a-z0-9-]{1,160}$/.test(r.companySlug) || rating === null || r.experienceConfirmed !== true) return null;
   return { id: r.id, kind: 'company', companySlug: r.companySlug, category: 'experience', rating, body };
 }
 if (!['idea','problem','other'].includes(String(r.category))) return null;
 return { id: r.id, kind: 'platform', companySlug: null, category: r.category as 'idea'|'problem'|'other', rating, body };
}
