import { it } from "node:test";
import assert from "node:assert/strict";
import { productionConfiguration } from "./production";
import { createEmailDelivery, emailConfiguration } from "./email";
const env={NODE_ENV:"production",MTP_PRODUCTION_AUTH:"enabled",MTP_AUTH_URL:"https://example.test",DATABASE_URL:"postgresql://synthetic:unused@localhost/isolated",BETTER_AUTH_SECRET:"synthetic-auth-secret-at-least-32-characters",MTP_RECEIPT_SECRET:"synthetic-receipt-secret-at-least-32-characters",MTP_AUTH_EMAIL_MODE:"resend",RESEND_API_KEY:"re_synthetic_never_sent",MTP_AUTH_EMAIL_FROM:"access@example.test"};
it("requires HTTPS, persistent database, independent secrets and real provider configuration",()=>{
 assert.equal(productionConfiguration(env).ready,true);
 for(const key of Object.keys(env).filter(k=>k!=="NODE_ENV"))assert.equal(productionConfiguration({...env,[key]:""}).ready,false,key);
 for(const origin of ["http://example.test","https://example.test/path","https://example.test/?x=1","https://user:pass@example.test","https://localhost"]) assert.equal(productionConfiguration({...env,MTP_AUTH_URL:origin}).ready,false);
 assert.equal(productionConfiguration({...env,MTP_AUTH_EMAIL_MODE:"simulated"}).ready,false);
});
it("production email has no local trial limit and accepts only the configured origin",async()=>{
 let sent=0;const deliver=createEmailDelivery({configuration:()=>emailConfiguration(env),environment:()=>"production",expectedMode:"resend",productionOrigin:"https://example.test",writeSimulation:async()=>{throw Error("must not simulate")},claimTrial:async()=>{throw Error("must not consume local trial")},finishTrial:async()=>{},transport:async(_url,init)=>{const body=JSON.parse(init!.body as string);assert.ok(!body.html.includes("PRUEBA LOCAL"));assert.ok(!body.text.includes("computer running"));sent++;return Response.json({id:"synthetic"});}});
 await deliver({email:"a@example.test",url:"https://example.test/api/auth/magic-link/verify?token=fake"});
 await deliver({email:"b@example.test",url:"https://example.test/api/auth/magic-link/verify?token=other-fake"});
 assert.equal(sent,2);
 await assert.rejects(deliver({email:"a@example.test",url:"https://attacker.invalid/api/auth/magic-link/verify?token=fake"}));assert.equal(sent,2);
});
