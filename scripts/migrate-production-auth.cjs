/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS migration loads TypeScript configuration */
// Run only against the designated production/staging database. Sends no emails.
// Preview builds intentionally have no production auth credentials. Never migrate authentication there.
if (process.env.VERCEL_ENV === "preview") {
  console.log("Preview build: production authentication migration skipped; sign-in remains unconfigured.");
} else {
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const resolve=Module._resolveFilename;Module._resolveFilename=function(r,...a){return resolve.call(this,r.startsWith('@/')?path.join(process.cwd(),'src',r.slice(2)):r,...a)};
require.extensions['.ts']=function(m,f){m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{esModuleInterop:true,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f)};
(async()=>{const {productionConfiguration}=require('../src/lib/auth/production.ts');const config=productionConfiguration();if(!config.ready)throw Error('Missing configuration: '+config.missing.join(', '));const {Pool}=require('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});try{await pool.query('SELECT pg_advisory_lock(847292)');const {createLocalAuth}=require('../src/lib/auth/config.ts');await createLocalAuth({database:pool,secret:process.env.BETTER_AUTH_SECRET,baseURL:config.origin,cookiePrefix:'mtp_production',deliver:async()=>{throw Error('Email disabled during migration')}});await pool.query(fs.readFileSync(path.join(process.cwd(),'src/lib/persistence/migrations/006-opinions.sql'),'utf8'));console.log('Production authentication tables ready; no email sent.');}finally{await pool.query('SELECT pg_advisory_unlock(847292)').catch(()=>{});await pool.end()}})().catch(()=>{console.error('Authentication migration failed; inspect configuration and database access.');process.exitCode=1});

}
