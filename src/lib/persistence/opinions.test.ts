import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { parseOpinion, OPINION_CONSENT, type OpinionInput } from '../opinions/input';
import { OpinionsRepository } from '../opinions/repository';

const alice='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',bob='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const input=(changes:Partial<OpinionInput>={}):OpinionInput=>({id:randomUUID(),kind:'company',companySlug:'example',category:'experience',rating:4,body:'The organisation and communication were helpful.',...changes});
test('validation requires explicit consent, real rating, work declaration and bounded content',()=>{
 const base={...input(),consent:true,consentVersion:OPINION_CONSENT,experienceConfirmed:true};
 assert.ok(parseOpinion(base));
 for(const overrides of [{consent:false},{consentVersion:'old'},{experienceConfirmed:false},{rating:0},{rating:6},{rating:'4'},{body:'short'},{body:'x'.repeat(2001)},{companySlug:'../bad'},{id:'invalid'}])assert.equal(parseOpinion({...base,...overrides}),null);
 const feedback=parseOpinion({...base,kind:'platform',category:'idea',rating:null,userId:bob,status:'approved'});
 assert.ok(feedback);assert.equal(feedback.companySlug,null);assert.ok(!('userId' in feedback));assert.ok(!('status' in feedback));
});

async function fixture(){
 const db=new PGlite();
 await db.exec('CREATE TABLE "user"(id uuid PRIMARY KEY)');
 const migration=await readFile('src/lib/persistence/migrations/006-opinions.sql','utf8');
 await db.exec(migration);
 await db.query('INSERT INTO "user" VALUES($1),($2)',[alice,bob]);
 const query=async(sql:string,values?:unknown[])=>{const r=await db.query<Record<string,unknown>>(sql,values);return{rows:r.rows,rowCount:r.affectedRows??r.rows.length};};
 const repository=new OpinionsRepository({query,connect:async()=>({query,release(){}})},true);
 return{db,repository,migration};
}
test('company reviews stay private until approved; public output excludes identity and feedback',async()=>{
 const f=await fixture();try{
  const review=input({body:'They promised one salary but paid something else.'});await f.repository.save(alice,review,'Example');
  await f.repository.save(bob,input({kind:'platform',companySlug:null,category:'idea'}),null);
  assert.equal((await f.repository.published('example')).count,0);
  assert.equal((await f.repository.mine(alice)).length,1);
  assert.equal((await f.repository.mine(bob))[0].kind,'platform');
  await f.db.query("UPDATE truckpay_opinions SET status='approved' WHERE id=$1",[review.id]);
  const publicData=await f.repository.published('example');assert.equal(publicData.count,1);assert.equal(publicData.average,4);
  assert.deepEqual(Object.keys(publicData.opinions[0]).sort(),['body','id','rating','updated_at']);
  await assert.rejects(f.db.query("UPDATE truckpay_opinions SET status='approved' WHERE kind='platform'"));
  assert.equal((await f.repository.published('other')).count,0);
 }finally{await f.db.close();}
});
test('edits replace one company review, return to moderation and cannot change another owner',async()=>{
 const f=await fixture();try{
  const first=input();await f.repository.save(alice,first,'Example');
  await f.db.query("UPDATE truckpay_opinions SET status='approved' WHERE id=$1",[first.id]);
  await f.repository.save(alice,input({rating:2,body:'Updated account of my own work experience.'}),'Example');
  const mine=await f.repository.mine(alice);assert.equal(mine.length,1);assert.equal(mine[0].id,first.id);assert.equal(mine[0].status,'pending');assert.equal(mine[0].rating,2);
  assert.equal((await f.repository.published('example')).count,0);
  assert.equal(await f.repository.remove(bob,first.id),false);
  await assert.rejects(f.repository.save(bob,{...first},'Example'));
  assert.equal((await f.repository.mine(bob)).length,0);
  assert.equal(await f.repository.remove(alice,first.id),true);
 }finally{await f.db.close();}
});
test('private feedback retries are idempotent and daily limits persist',async()=>{
 const f=await fixture();try{
  const feedback=input({kind:'platform',companySlug:null,category:'problem',rating:null});
  await f.repository.save(alice,feedback,null);await f.repository.save(alice,feedback,null);
  assert.equal((await f.repository.mine(alice)).length,1);
  for(let i=0;i<9;i++)await f.repository.save(alice,{...feedback,id:randomUUID()},null);
  await assert.rejects(f.repository.save(alice,{...feedback,id:randomUUID()},null),/DAILY_LIMIT/);
  assert.equal((await f.repository.mine(alice)).length,10);
 }finally{await f.db.close();}
});
test('migration is repeatable and account deletion removes public and private contributions',async()=>{
 const f=await fixture();try{
  await f.repository.save(alice,input(),'Example');
  await f.repository.save(alice,input({kind:'platform',companySlug:null,category:'other'}),null);
  await f.repository.save(bob,input(),'Example');
  await f.db.exec(f.migration);
  assert.equal((await f.repository.mine(alice)).length,2);
  await f.db.query('DELETE FROM "user" WHERE id=$1',[alice]);
  assert.equal((await f.repository.mine(alice)).length,0);
  assert.equal((await f.repository.mine(bob)).length,1);
  await assert.rejects(f.repository.save(alice,input(),'Example'),/ACCOUNT_MISSING/);
 }finally{await f.db.close();}
});
test('moderation of an old revision cannot publish newer text',async()=>{
 const f=await fixture();try{
  const review=input({body:'They promised one salary but paid something else.'});await f.repository.save(alice,review,'Example');
  const old=(await f.db.query<{revision:string}>('SELECT revision FROM truckpay_opinions WHERE id=$1',[review.id])).rows[0].revision;
  await f.repository.save(alice,input({body:'This is the updated review that must be checked again.'}),'Example');
  const result=await f.db.query("UPDATE truckpay_opinions SET status='approved' WHERE id=$1 AND revision=$2 AND status='pending' RETURNING id",[review.id,old]);
  assert.equal(result.rows.length,0);assert.equal((await f.repository.published('example')).count,0);
 }finally{await f.db.close();}
});
test('automatic publication returns real status and sensitive edits withdraw it',async()=>{
 const f=await fixture();try{
  const review=input();const result=await f.repository.save(alice,review,'Example');
  assert.equal(result.status,'approved');assert.equal((await f.repository.published('example')).count,1);
  await f.repository.save(alice,input({body:'They promised one salary but paid something else.'}),'Example');
  assert.equal((await f.repository.published('example')).count,0);
  const queue=await f.repository.queue();assert.equal(queue.length,1);assert.equal(queue[0].reason,'sensitive_claim');assert.ok(!('user_id' in queue[0]));
  assert.equal(await f.repository.review(String(queue[0].id),randomUUID(),'approved'),null);
  assert.ok(await f.repository.review(String(queue[0].id),String(queue[0].revision),'approved'));
  assert.equal((await f.repository.published('example')).count,1);
  assert.equal(await f.repository.review(String(queue[0].id),String(queue[0].revision),'rejected'),null);
 }finally{await f.db.close();}
});
test('unconfigured rollout retains manual review instead of enabling automatic publication',async()=>{
 const f=await fixture();try{
  const query=async(sql:string,values?:unknown[])=>{const result=await f.db.query<Record<string,unknown>>(sql,values);return {rows:result.rows,rowCount:result.affectedRows??result.rows.length};};
  const disabled=new OpinionsRepository({query,connect:async()=>({query,release(){}})},false);
  assert.equal((await disabled.save(alice,input(),'Example')).status,'pending');
  assert.equal((await disabled.published('example')).count,0);
 }finally{await f.db.close();}
});
