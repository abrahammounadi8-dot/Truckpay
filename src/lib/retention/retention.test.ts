import { it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import { recordActivity, runRetention as runRetentionWithLedger } from "./service";
import { externalLedgerSchema, postgresDeletionLedger } from "./external-ledger";
const unitLedger = { assertReady: async () => {}, prepare: async () => {}, complete: async () => {} };
const runRetention = (...args: Parameters<typeof runRetentionWithLedger>) => runRetentionWithLedger(args[0], args[1], args[2], args[3] ?? unitLedger);
import { resendRetentionMail, retentionEmail } from "./email";
import { GET as retentionRoute } from "../../app/api/internal/retention/route";
import { reconcileRestoredCopy } from "./restore";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
function asPool(db: PGlite): Pool {
 const query=async(sql:string,params?:unknown[])=>{const r=await db.query(sql,params);return {rows:r.rows,rowCount:/^\s*SELECT/i.test(sql)?r.rows.length:r.affectedRows};};
 return {query,connect:async()=>({query,release:()=>{}})} as unknown as Pool;
}
async function fixture() {
 const db = new PGlite();
 await db.exec(`CREATE TABLE "user"(id uuid PRIMARY KEY,email text);
 CREATE TABLE "session"(id text,"userId" uuid,"expiresAt" timestamptz);
 CREATE TABLE account(id text,"userId" uuid);
 CREATE TABLE verification(id text,value text,"expiresAt" timestamptz);`);
 for (const file of ["001-documents.sql","002-retention.sql"]) await db.exec(await readFile(`src/lib/persistence/migrations/${file}`,"utf8"));
 const query = async (sql: string, params?: unknown[]) => { const r=await db.query(sql,params);return {rows:r.rows,rowCount:/^\s*SELECT/i.test(sql)?r.rows.length:r.affectedRows}; };
 const pool = {query,connect:async()=>({query,release:()=>{}})} as unknown as Pool;
 await db.query('INSERT INTO "user" VALUES($1,$2)',[id,"synthetic@example.test"]);
 let sends=0;
 const mail={send:async()=>{sends++;return "synthetic-message";},delivered:async()=>true};
 const age=async()=>{assert.equal(await recordActivity(pool,id),true);await db.query("UPDATE truckpay_retention SET last_active_at=now()-interval '24 months'");};
 const ready=async()=>{await age();await runRetention(pool,mail,"notify");await runRetention(pool,mail,"notify");};
 const count=async(table:string)=>Number((await db.query<{n:number}>(`SELECT count(*)::int n FROM ${table}`)).rows[0].n);
 return {db,pool,mail,age,ready,count,sends:()=>sends};
}

it("dry-run never seeds, sends or deletes; legacy users get a new 24 month clock",async()=>{
 const f=await fixture();try {
  await runRetention(f.pool,f.mail);assert.equal(await f.count("truckpay_retention"),0);assert.equal(f.sends(),0);
  await runRetention(f.pool,f.mail,"notify");assert.equal(await f.count("truckpay_retention"),1);assert.equal(f.sends(),0);
 }finally{await f.db.close();}
});
it("requires 24 calendar months and then 30 full days after delivery confirmation",async()=>{
 const f=await fixture();try {
  await f.age();await f.db.query("UPDATE truckpay_retention SET last_active_at=now()-interval '24 months'+interval '1 day'");
  await runRetention(f.pool,f.mail,"delete");assert.equal(f.sends(),0);
  await f.ready();assert.equal(f.sends(),1);
  await f.db.query("UPDATE truckpay_retention SET delivered_at=now()-interval '30 days'+interval '1 minute'");
  assert.equal((await runRetention(f.pool,f.mail,"delete")).deleted,0);
  await f.db.query("UPDATE truckpay_retention SET delivered_at=now()-interval '30 days'");
  assert.equal((await runRetention(f.pool,f.mail,"delete")).deleted,1);
  assert.equal(await f.count('"user"'),0);assert.equal(await f.count("truckpay_retention_deletions"),1);
  assert.equal((await runRetention(f.pool,f.mail,"delete")).deleted,0);
 }finally{await f.db.close();}
});
it("activity cancels notice and prevents a late delivery result from rearming deletion",async()=>{
 const f=await fixture();try {
  await f.age();await runRetention(f.pool,f.mail,"notify");
  const mail={...f.mail,delivered:async()=>{await recordActivity(f.pool,id);return true;}};
  assert.equal((await runRetention(f.pool,mail,"notify")).delivered,0);
  const r=await f.db.query<{state:string;notice_id:string|null}>("SELECT * FROM truckpay_retention");
  assert.equal(r.rows[0].state,"active");assert.equal(r.rows[0].notice_id,null);
  assert.equal((await runRetention(f.pool,mail,"delete")).deleted,0);
 }finally{await f.db.close();}
});
it("failed or ambiguous delivery blocks deletion and does not automatically resend",async()=>{
 const f=await fixture();try {
  await f.age();let attempts=0;
  const mail={...f.mail,send:async()=>{attempts++;throw Error("network timeout");}};
  assert.equal((await runRetention(f.pool,mail,"delete")).errors,1);
  await runRetention(f.pool,mail,"delete");assert.equal(attempts,1);assert.equal(await f.count('"user"'),1);
 }finally{await f.db.close();}
});
it("provider acceptance alone does not start the grace period",async()=>{
 const f=await fixture();try {
  await f.age();const mail={...f.mail,delivered:async()=>false};
  await runRetention(f.pool,mail,"delete");await runRetention(f.pool,mail,"delete");
  const r=await f.db.query<{delivered_at:null}>("SELECT delivered_at FROM truckpay_retention");assert.equal(r.rows[0].delivered_at,null);assert.equal(await f.count('"user"'),1);
 }finally{await f.db.close();}
});
it("active sessions or pending sign-in links defer deletion",async()=>{
 const f=await fixture();try {
  await f.ready();await f.db.query("UPDATE truckpay_retention SET delivered_at=now()-interval '31 days'");
  await f.db.query('INSERT INTO "session" VALUES($1,$2,now()+interval \'1 hour\')',["s",id]);
  assert.equal((await runRetention(f.pool,f.mail,"delete")).deleted,0);
  await f.db.exec('DELETE FROM "session"');
  await f.db.query("INSERT INTO verification VALUES('v',$1,now()+interval '10 minutes')",[JSON.stringify({email:"synthetic@example.test"})]);
  assert.equal((await runRetention(f.pool,f.mail,"delete")).deleted,0);
 }finally{await f.db.close();}
});
it("a failed account deletion rolls back payroll deletion",async()=>{
 const f=await fixture();try {
  await f.ready();await f.db.query("UPDATE truckpay_retention SET delivered_at=now()-interval '31 days'");
  await f.db.query("INSERT INTO truckpay_documents(kind,id,user_id,payload) VALUES('profile',$1,$2::uuid,'{}')",[id,id]);
  await f.db.exec('CREATE TABLE blocker(user_id uuid REFERENCES "user"(id));');
  await f.db.query("INSERT INTO blocker VALUES($1)",[id]);
  assert.equal((await runRetention(f.pool,f.mail,"delete")).errors,1);
  assert.equal(await f.count("truckpay_documents"),1);assert.equal(await f.count('"user"'),1);assert.equal(await f.count("truckpay_retention_deletions"),0);
 }finally{await f.db.close();}
});
it("plain-text notice links to the account, never includes payroll or a magic token",async()=>{
 const content=retentionEmail("https://mytruckpay.com");assert.match(content.text,/30 days/);assert.match(content.text,/24 meses/);assert.match(content.text,/https:\/\/mytruckpay.com\/account/);assert.doesNotMatch(content.text,/token=/);
 const transport=(async()=>new Response(JSON.stringify({id:"message",last_event:"bounced"}),{status:200})) as typeof fetch;
 const mail=resendRetentionMail({RESEND_API_KEY:"test",MTP_AUTH_EMAIL_FROM:"privacy@mytruckpay.com",MTP_AUTH_URL:"https://mytruckpay.com"},transport);
 assert.equal(await mail.delivered("message"),false);
});
it("cron rejects missing or incorrect credentials and cannot delete without restore readiness",async()=>{
 const names=["CRON_SECRET","MTP_RETENTION_ENABLED","MTP_RETENTION_MODE","MTP_RETENTION_RESTORE_READY"];
 const before=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 try {
  const secret="s".repeat(40);process.env.CRON_SECRET=secret;
  const request=(token?:string)=>new Request("https://mytruckpay.com/api/internal/retention",{headers:token?{authorization:`Bearer ${token}`}:{}});
  assert.equal((await retentionRoute(request())).status,401);
  assert.equal((await retentionRoute(request("x".repeat(40)))).status,401);
  delete process.env.MTP_RETENTION_ENABLED;
  assert.deepEqual(await (await retentionRoute(request(secret))).json(),{status:"disabled"});
  process.env.MTP_RETENTION_ENABLED="enabled";process.env.MTP_RETENTION_MODE="delete";delete process.env.MTP_RETENTION_RESTORE_READY;
  assert.equal((await retentionRoute(request(secret))).status,503);
 } finally {for(const name of names){if(before[name]===undefined)delete process.env[name];else process.env[name]=before[name];}}
});
it("restores a real database archive then reapplies an independent deletion ledger without reviving consent or sessions",async()=>{
 const f=await fixture();let restored:PGlite|undefined;
 try {
  const survivor="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await f.db.query('INSERT INTO "user" VALUES($1,$2)',[survivor,"survivor@example.test"]);
  for(const user of [id,survivor]) {
   await f.db.query("INSERT INTO truckpay_documents(kind,id,user_id,content_hash,payload) VALUES('payslip',$1,$2::uuid,$1,$3::jsonb)",[user+"-slip",user,JSON.stringify({netPay:700})]);
   await f.db.query("INSERT INTO truckpay_documents(kind,id,user_id,payload) VALUES('profile',$1,$2::uuid,$3::jsonb)",[user,user,JSON.stringify({statisticsSharing:{enabled:true,noticeVersion:"2026-09-28"}})]);
  }
  await f.ready();
  await f.db.query('INSERT INTO "session" VALUES($1,$2,now()+interval \'1 day\')',["survivor-session",survivor]);
  await f.db.query("INSERT INTO verification VALUES('old-link',$1,now()+interval '10 minutes')",[JSON.stringify({email:"survivor@example.test"})]);
  const backup=await f.db.dumpDataDir();
  await f.db.query("UPDATE truckpay_retention SET delivered_at=now()-interval '31 days' WHERE user_id=$1",[id]);
  assert.equal((await runRetention(f.pool,f.mail,"delete")).deleted,1);
  // Kept outside the archive being restored, as required by the operator procedure.
  const ledger=(await f.db.query<{user_id:string;deleted_at:Date}>("SELECT * FROM truckpay_retention_deletions")).rows.map(r=>({user_id:r.user_id,deleted_at:r.deleted_at.toISOString()}));
  restored=new PGlite({loadDataDir:backup});
  assert.equal((await restored.query('SELECT * FROM "user" WHERE id=$1',[id])).rows.length,1);
  const pool=asPool(restored);
  await reconcileRestoredCopy(pool,ledger);
  assert.equal((await restored.query('SELECT * FROM "user" WHERE id=$1',[id])).rows.length,0);
  assert.equal((await restored.query('SELECT * FROM truckpay_documents WHERE user_id=$1::uuid',[id])).rows.length,0);
  assert.equal((await restored.query("SELECT * FROM truckpay_documents WHERE user_id=$1::uuid AND kind='payslip'",[survivor])).rows.length,1);
  assert.equal((await restored.query('SELECT * FROM "session"')).rows.length,0);
  assert.equal((await restored.query('SELECT * FROM verification')).rows.length,0);
  const profiles=await restored.query<{payload:{statisticsSharing:{enabled:boolean}}}>("SELECT payload FROM truckpay_documents WHERE kind='profile'");
  assert.equal(profiles.rows[0].payload.statisticsSharing.enabled,false);
  assert.equal((await runRetention(pool,f.mail,"delete")).eligible,0);
  await reconcileRestoredCopy(pool,ledger); // Idempotent replay remains safe.
  assert.equal((await restored.query('SELECT * FROM "user"')).rows.length,1);
 } finally {await restored?.close();await f.db.close();}
});

it("refuses deletion without an external ledger and rolls back if reservation fails", async () => {
 const f=await fixture();try {
  await f.ready();await f.db.query("UPDATE truckpay_retention SET delivered_at=now()-interval '31 days'");
  await assert.rejects(runRetentionWithLedger(f.pool,f.mail,"delete"));
  const ledger={...unitLedger,prepare:async()=>{throw Error("unavailable");}};
  const result=await runRetentionWithLedger(f.pool,f.mail,"delete",ledger);
  assert.equal(result.deleted,0);assert.equal(result.errors,1);
  assert.equal(await f.count('"user"'),1);assert.equal(await f.count("truckpay_retention_deletions"),0);
 }finally{await f.db.close();}
});
it("external confirmation failure blocks recovery until reconciled with the committed source ledger", async () => {
 const f=await fixture();const external=new PGlite();try {
  await external.exec(externalLedgerSchema);
  const ledger=postgresDeletionLedger(asPool(external));
  await f.ready();await f.db.query("UPDATE truckpay_retention SET delivered_at=now()-interval '31 days'");
  const result=await runRetentionWithLedger(f.pool,f.mail,"delete",{...ledger,complete:async()=>{throw Error("connection lost");}});
  assert.equal(result.deleted,1);assert.equal(result.errors,1);assert.equal(await f.count('"user"'),0);
  await assert.rejects(ledger.readForRestore());
  await assert.rejects(runRetentionWithLedger(f.pool,f.mail,"delete",ledger));
  const source=(await f.db.query<{user_id:string;deleted_at:Date}>("SELECT * FROM truckpay_retention_deletions")).rows[0];
  const confirmed={user_id:source.user_id,deleted_at:new Date(source.deleted_at).toISOString()};
  await ledger.complete(confirmed);await ledger.complete(confirmed);
  assert.deepEqual(await ledger.readForRestore(),[confirmed]);
  await ledger.assertReady();
 }finally{await external.close();await f.db.close();}
});
