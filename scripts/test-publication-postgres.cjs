/* eslint-disable @typescript-eslint/no-require-imports -- standalone real PostgreSQL concurrency harness */
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),ts=require('typescript'),{Pool}=require('pg');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename;
Module._resolveFilename=function(r,...a){return resolve.call(this,r.startsWith('@/')?path.join(root,'src',r.slice(2)):r,...a)};
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {seedPublicationDatabase,publicationTestRequest:request}=require('../src/lib/payroll/testing/publication-database-fixture.ts');
const {prepareStoredPublicationReview,reserveStoredPublicationReview,loadPublicationSource}=require('../src/lib/payroll/publication-source.ts');
const {reservePublicationReview}=require('../src/lib/payroll/publication-journal.ts');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const url=new URL(process.env.MTP_TEST_DATABASE_URL||'invalid');
 assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/truckpay_test','Only the dedicated localhost truckpay_test database is allowed.');
 const pool=new Pool({connectionString:url.href,max:6,options:'-c statement_timeout=12000 -c lock_timeout=10000'});
 const deadline=setTimeout(()=>{console.error('PostgreSQL concurrency test timed out.');process.exit(1)},60000);
 try {
  for(const n of ['001-documents.sql','003-publication-review.sql','004-publication-source.sql','005-publication-identity-controls.sql'])await pool.query(fs.readFileSync(path.join(root,'src/lib/persistence/migrations',n),'utf8'));
  async function seed(){await pool.query('TRUNCATE truckpay_documents, truckpay_publication_identities, truckpay_publication_review_people, truckpay_publication_reviews');return seedPublicationDatabase(pool)}
  async function blocked(pid){for(let i=0;i<100;i++){const r=await pool.query('SELECT cardinality(pg_blocking_pids($1)) AS n',[pid]);if(r.rows[0].n>0)return;await pause(30)}throw Error('Expected database lock was not observed.')}
  let users=await seed(),review=await prepareStoredPublicationReview(pool,request);
  const writer=await pool.connect();
  try {
   await writer.query('BEGIN');
   await writer.query("UPDATE truckpay_documents SET payload=jsonb_set(payload,'{statisticsSharing,enabled}','false') WHERE kind='profile' AND user_id=$1::uuid",[users[0]]);
   let resolvePid;const pidReady=new Promise(r=>{resolvePid=r});
   const observedPool={connect:async()=>{const c=await pool.connect();resolvePid((await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);return c}};
   const attempt=reserveStoredPublicationReview(observedPool,request,review,'synthetic-withdrawal-first').then(()=>null,e=>e);
   await blocked(await pidReady);await writer.query('COMMIT');
   assert.match((await attempt).message,/stale or blocked/);
   assert.equal((await pool.query('SELECT id FROM truckpay_publication_reviews')).rowCount,0);
  }finally{await writer.query('ROLLBACK');writer.release()}
  console.log('PASS withdrawal first: reservation waits for committed consent and rejects stale review.');

  users=await seed();review=await prepareStoredPublicationReview(pool,request);
  let ready,continueReserve;const locked=new Promise(r=>{ready=r}),proceed=new Promise(r=>{continueReserve=r});
  const reservation=reservePublicationReview(pool,review,'synthetic-reservation-first',async c=>{const input=await loadPublicationSource(c,request);ready();await proceed;return input});
  await locked;
  const laterWriter=await pool.connect();
  try {
   const pid=(await laterWriter.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
   const withdrawal=laterWriter.query("UPDATE truckpay_documents SET payload=jsonb_set(payload,'{statisticsSharing,enabled}','false') WHERE kind='profile' AND user_id=$1::uuid",[users[0]]);
   await blocked(pid);continueReserve();await reservation;await withdrawal;
   const row=(await pool.query('SELECT proposal,invalidated_at FROM truckpay_publication_reviews')).rows[0];
   assert.ok(row.invalidated_at);assert.deepEqual(row.proposal,review.proposal);
  }finally{continueReserve();laterWriter.release()}
  console.log('PASS reservation first: withdrawal waits, then invalidates the committed batch without changing its figures.');

  await seed();review=await prepareStoredPublicationReview(pool,request);
  const attempts=await Promise.allSettled([reserveStoredPublicationReview(pool,request,review,'synthetic-a'),reserveStoredPublicationReview(pool,request,review,'synthetic-b')]);
  assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await pool.query('SELECT id FROM truckpay_publication_reviews')).rowCount,1);
  assert.equal((await pool.query('SELECT person_key FROM truckpay_publication_review_people')).rowCount,11);
  console.log('PASS concurrent reservations: exactly one durable batch and one membership per person.');

  users=await seed();review=await prepareStoredPublicationReview(pool,request);
  const identityWriter=await pool.connect();
  try {
   await identityWriter.query('BEGIN');await identityWriter.query('UPDATE truckpay_publication_identities SET revoked_at=now() WHERE user_id=$1::uuid',[users[0]]);
   let resolvePid;const pidReady=new Promise(r=>{resolvePid=r});
   const observedPool={connect:async()=>{const c=await pool.connect();resolvePid((await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);return c}};
   const attempt=reserveStoredPublicationReview(observedPool,request,review,'synthetic-identity-change').then(()=>null,e=>e);
   await blocked(await pidReady);await identityWriter.query('COMMIT');assert.match((await attempt).message,/stale or blocked/);
  }finally{await identityWriter.query('ROLLBACK');identityWriter.release()}
  console.log('PASS concurrent identity revocation: stale distinct-person review cannot be reserved. Synthetic data only.');
 }finally{clearTimeout(deadline);await pool.end()}
})().catch(error=>{console.error(error.message);process.exitCode=1});
