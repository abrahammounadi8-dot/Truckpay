import { privateApiIdentity, privateJson } from '@/lib/payroll/session';
import { database } from '@/lib/persistence/database';
import { moderatorAllowed } from '@/lib/opinions/moderation';
import { OpinionsRepository } from '@/lib/opinions/repository';
export const runtime='nodejs';
async function authorize(request:Request) {
 const identity=await privateApiIdentity(request);
 if(identity instanceof Response)return identity;
 return moderatorAllowed(identity)?identity:privateJson({error:'Moderator access required.'},{status:403});
}
export async function GET(request:Request) {
 try {
  const identity=await authorize(request);if(identity instanceof Response)return identity;
  return privateJson({opinions:await new OpinionsRepository(database()).queue()});
 }catch{return privateJson({error:'Moderation is temporarily unavailable.'},{status:503});}
}
export async function POST(request:Request) {
 try {
  const identity=await authorize(request);if(identity instanceof Response)return identity;
  const reader=request.body?.getReader();if(!reader)return privateJson({error:'Invalid request.'},{status:400});
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1000){await reader.cancel();return privateJson({error:'Request too large.'},{status:413});}chunks.push(part.value);}
  const text=Buffer.concat(chunks).toString('utf8');
  let input;try{input=JSON.parse(text);}catch{return privateJson({error:'Invalid request.'},{status:400});}
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!input||!uuid.test(input.id)||!uuid.test(input.revision)||!['approved','rejected'].includes(input.status))return privateJson({error:'Invalid decision.'},{status:400});
  const result=await new OpinionsRepository(database()).review(input.id,input.revision,input.status);
  if(!result)return privateJson({error:'This review changed. Reload the queue.'},{status:409});
  console.info('Opinion moderation decision',{id:input.id,revision:input.revision,status:input.status});
  return privateJson(result);
 }catch{return privateJson({error:'Could not save the decision.'},{status:503});}
}
