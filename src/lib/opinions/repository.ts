import type { Queryable } from '../persistence/documents';
import { OPINION_CONSENT, type OpinionInput } from './input';
export interface OpinionDatabase extends Queryable {
 connect(): Promise<Queryable & { release(): void }>;
}
export type OpinionRecord = {
 id: string; kind: 'company'|'platform'; company_slug: string|null; company_name: string|null;
 category: string; rating: number|null; body: string; status: string; updated_at: string;
};
const ownColumns = 'id,kind,company_slug,company_name,category,rating,body,status,updated_at';
export class OpinionsRepository {
 constructor(private readonly db: OpinionDatabase) {}
 async mine(userId: string) {
   return (await this.db.query(`SELECT ${ownColumns} FROM truckpay_opinions WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 100`,[userId])).rows as unknown as OpinionRecord[];
 }
 async companies() {
   return (await this.db.query("SELECT DISTINCT ON (company_slug) company_slug AS slug,company_name AS name FROM truckpay_opinions WHERE kind='company' AND status='approved' ORDER BY company_slug,updated_at DESC")).rows as unknown as {slug:string;name:string}[];
 }
 async published(company: string) {
   const result = await this.db.query(`SELECT id,rating,body,updated_at FROM truckpay_opinions WHERE kind='company' AND status='approved' AND company_slug=$1 ORDER BY updated_at DESC LIMIT 50`,[company]);
   const aggregate = await this.db.query(`SELECT count(*)::int AS count,round(avg(rating),1)::float8 AS average FROM truckpay_opinions WHERE kind='company' AND status='approved' AND company_slug=$1`,[company]);
   return { opinions: result.rows, count: aggregate.rows[0]?.count ?? 0, average: aggregate.rows[0]?.average ?? null };
 }
 async save(userId: string, input: OpinionInput, companyName: string|null) {
   const client = await this.db.connect();
   try {
     await client.query('BEGIN');
     // Serializes submissions per account and prevents insert-after-account-deletion races.
     const owner = await client.query('SELECT id FROM "user" WHERE id::text=$1 FOR UPDATE',[userId]);
     if (!owner.rows.length) throw new Error('ACCOUNT_MISSING');
     const prior = await client.query('SELECT id,kind,body,category,rating FROM truckpay_opinions WHERE id=$1 AND user_id=$2',[input.id,userId]);
     if (input.kind === 'platform' && prior.rows.length) {
       const old=prior.rows[0];
       if(old.kind!=='platform'||old.body!==input.body||old.category!==input.category||old.rating!==input.rating)throw new Error('ID_CONFLICT');
       await client.query('COMMIT'); return { saved: true };
     }
     const recent = await client.query("SELECT count(*)::int AS n FROM truckpay_opinions WHERE user_id=$1 AND created_at>now()-interval '1 day'",[userId]);
     if (Number(recent.rows[0]?.n) >= 10) throw new Error('DAILY_LIMIT');
     const conflict = input.kind === 'company'
       ? `ON CONFLICT (user_id,company_slug) WHERE kind='company' DO UPDATE SET rating=EXCLUDED.rating,body=EXCLUDED.body,status='pending',consent_version=EXCLUDED.consent_version,updated_at=now(),revision=gen_random_uuid()` : '';
     await client.query(`INSERT INTO truckpay_opinions(id,user_id,kind,company_slug,company_name,category,rating,body,status,consent_version)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ${conflict}`,
       [input.id,userId,input.kind,input.companySlug,companyName,input.category,input.rating,input.body,input.kind==='company'?'pending':'received',OPINION_CONSENT]);
     await client.query('COMMIT'); return { saved: true };
   } catch (error) { await client.query('ROLLBACK'); throw error; }
   finally { client.release(); }
 }
 async remove(userId: string, id: string) {
   const result=await this.db.query('DELETE FROM truckpay_opinions WHERE id=$1 AND user_id=$2 RETURNING id',[id,userId]);
   return result.rows.length > 0;
 }
}
