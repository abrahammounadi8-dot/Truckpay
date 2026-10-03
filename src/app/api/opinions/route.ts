import { database } from '@/lib/persistence/database';
import { privateApiIdentity, privateJson } from '@/lib/payroll/session';
import { listDirectoryCompanies } from '@/lib/directory-store';
import { parseOpinion } from '@/lib/opinions/input';
import { OpinionsRepository } from '@/lib/opinions/repository';
import { rateLimit } from '@/lib/http/request-limits';
export const runtime='nodejs';
export async function GET(request: Request) {
 try {
   const params=new URL(request.url).searchParams;
   if (params.get('scope')==='mine') {
     const identity=await privateApiIdentity(request); if(identity instanceof Response) return identity;
     return privateJson({opinions:await new OpinionsRepository(database()).mine(identity)});
   }
   const company=params.get('company');
   if(!company || !/^[a-z0-9-]{1,160}$/.test(company)) return privateJson({error:'Choose a company.'},{status:400});
   return privateJson(await new OpinionsRepository(database()).published(company));
 } catch { return privateJson({error:'Opinions are temporarily unavailable.'},{status:503}); }
}
export async function POST(request: Request) {
 try {
   const identity=await privateApiIdentity(request); if(identity instanceof Response) return identity;
   const limited=rateLimit(request,{scope:'opinions-write',limit:10,windowMs:60000}); if(limited) return limited;
   // Bound actual bytes, including requests without Content-Length.
   const reader=request.body?.getReader(); if(!reader) return privateJson({error:'Invalid request.'},{status:400});
   const chunks:Uint8Array[]=[]; let size=0;
   while(true) { const part=await reader.read(); if(part.done) break; size+=part.value.byteLength; if(size>12000) {await reader.cancel();return privateJson({error:'Request too large.'},{status:413});} chunks.push(part.value); }
   let raw:unknown; try {raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch{return privateJson({error:'Invalid JSON.'},{status:400});}
   const input=parseOpinion(raw); if(!input) return privateJson({error:'Check the form and consent.'},{status:400});
   const company=input.kind==='company'?(await listDirectoryCompanies()).find(c=>c.slug===input.companySlug):null;
   if(input.kind==='company'&&!company) return privateJson({error:'Company not found.'},{status:400});
   const result=await new OpinionsRepository(database()).save(identity,input,company?.name??null);
   return privateJson({saved:true,status:result.status},{status:201});
 } catch(error) { const limited=error instanceof Error&&error.message==='DAILY_LIMIT'; return privateJson({error:limited?'Daily submission limit reached.':'Could not save your contribution.'},{status:limited?429:503}); }
}
export async function DELETE(request: Request) {
 try {
   const identity=await privateApiIdentity(request); if(identity instanceof Response)return identity;
   const id=new URL(request.url).searchParams.get('id');
   if(!id||!/^[0-9a-f-]{36}$/i.test(id))return privateJson({error:'Invalid id.'},{status:400});
   const removed=await new OpinionsRepository(database()).remove(identity,id);
   return privateJson({removed},{status:removed?200:404});
 }catch{return privateJson({error:'Could not remove contribution.'},{status:503});}
}
