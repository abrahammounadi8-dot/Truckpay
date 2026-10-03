"use client";

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useT } from './language-provider';
import { OPINION_CONSENT } from '@/lib/opinions/input';
import type { OpinionRecord } from '@/lib/opinions/repository';

type Published = { opinions: Pick<OpinionRecord,'id'|'rating'|'body'|'updated_at'>[]; count:number; average:number|null };
type Company = {slug:string;name:string};
export function OpinionsHub({companies,initialCompany,initialTab}:{companies:Company[];initialCompany:string;initialTab:'company'|'platform'}) {
 const {locale}=useT(); const es=locale==='es'; const c=(a:string,b:string)=>es?a:b;
 const [tab,setTab]=useState(initialTab);
 const [company,setCompany]=useState(companies.some(x=>x.slug===initialCompany)?initialCompany:companies[0]?.slug??'');
 const [authenticated,setAuthenticated]=useState(false);
 const [mine,setMine]=useState<OpinionRecord[]>([]);
 const [publicData,setPublicData]=useState<Published|null>(null);
 const [mineError,setMineError]=useState(false);
 const [publicError,setPublicError]=useState(false);
 const [revision,setRevision]=useState(0);
 const [deleting,setDeleting]=useState('');
 const [confirmDelete,setConfirmDelete]=useState('');
 const [deleteError,setDeleteError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/opinions?scope=mine',{signal:controller.signal,credentials:'same-origin'}).then(async r=>{
   if(r.status===401){setAuthenticated(false);setMine([]);setMineError(false);return;}
   if(!r.ok)throw Error('load');
   const data=await r.json();setAuthenticated(true);setMine(data.opinions);setMineError(false);
  }).catch(e=>{if(e.name!=='AbortError')setMineError(true);});
  return()=>controller.abort();
 },[revision]);
 useEffect(()=>{
  if(!company)return;
  const controller=new AbortController();
  fetch(`/api/opinions?company=${encodeURIComponent(company)}`,{signal:controller.signal}).then(async r=>{
   if(!r.ok)throw Error('load');return r.json();
  }).then(data=>{setPublicData(data);setPublicError(false);}).catch(e=>{if(e.name!=='AbortError')setPublicError(true);});
  return()=>controller.abort();
 },[company,revision]);
 function selectCompany(value:string){setCompany(value);setPublicData(null);setPublicError(false);}
 async function remove(id:string){
  setDeleting(id);setDeleteError(false);
  try {const r=await fetch(`/api/opinions?id=${encodeURIComponent(id)}`,{method:'DELETE'});if(!r.ok)throw Error('delete');setMine(rows=>rows.filter(row=>row.id!==id));setRevision(v=>v+1);setConfirmDelete('');}
  catch {setDeleteError(true);}finally{setDeleting('');}
 }
 const statuses:Record<string,string>={pending:c('Pendiente de revisión','Awaiting review'),approved:c('Publicada','Published'),rejected:c('No publicada · puedes revisarla y volver a enviarla','Not published · you can revise and resubmit'),received:c('Recibida por MyTruckPay','Received by MyTruckPay'),reviewed:c('Revisada por MyTruckPay','Reviewed by MyTruckPay')};
 return <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:py-12">
  <header className="rounded-2xl border-b-4 border-accent bg-primary p-6 text-primary-foreground sm:p-8">
   <p className="text-xs font-semibold uppercase tracking-widest text-accent">{c('Tu experiencia cuenta','Your experience matters')}</p>
   <h1 className="mt-2 font-heading text-4xl font-semibold">{c('Opiniones y sugerencias','Reviews and suggestions')}</h1>
   <p className="mt-3 max-w-2xl text-sm leading-6">{c('Ayuda a otros conductores a conocer las empresas y ayúdanos a mejorar MyTruckPay.','Help other drivers learn about employers and help us improve MyTruckPay.')}</p>
  </header>
  <div className="grid grid-cols-2 gap-3" aria-label={c('Tipo de aportación','Contribution type')}>
   {(['company','platform'] as const).map(value=><button key={value} type="button" aria-pressed={tab===value} onClick={()=>setTab(value)} className={`min-h-16 rounded-xl border p-3 text-left font-semibold ${tab===value?'border-primary bg-primary text-primary-foreground':'bg-card'}`}>
    {value==='company'?c('Opiniones de empresas','Company reviews'):c('Mejorar MyTruckPay','Improve MyTruckPay')}
   </button>)}
  </div>
  {tab==='company'?<section className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="company-reviews-title">
   <h2 id="company-reviews-title" className="font-heading text-2xl font-semibold">{c('Experiencias de conductores','Driver experiences')}</h2>
   <label className="block text-sm font-medium">{c('Empresa','Company')}<select className="mt-2 min-h-12 w-full rounded-lg border bg-background p-3" value={company} onChange={e=>selectCompany(e.target.value)}>{companies.map(x=><option key={x.slug} value={x.slug}>{x.name}</option>)}</select></label>
   <p className="text-sm text-muted-foreground">{c('Experiencias personales declaradas por sus autores. Una cuenta confirmada no verifica una relación laboral ni la exactitud de la opinión.','Personal experiences reported by their authors. A confirmed account does not verify employment or the accuracy of a review.')}</p>
   {!company?<p>{c('Todavía no hay empresas disponibles.','No companies are available yet.')}</p>:publicError?<p role="alert">{c('No pudimos cargar las opiniones.','We could not load reviews.')} <button className="underline" onClick={()=>setRevision(v=>v+1)}>{c('Reintentar','Retry')}</button></p>:!publicData?<p role="status">{c('Cargando opiniones…','Loading reviews…')}</p>:<>
    <div className="rounded-xl bg-accent/15 p-4"><p className="font-heading text-3xl font-semibold">{publicData.count>0?`${publicData.average} / 5`:c('Sin valoraciones todavía','No ratings yet')}</p><p className="mt-1 text-sm">{publicData.count} {c('opiniones publicadas','published reviews')}</p></div>
    {publicData.count===0&&<p className="text-sm">{c('Sé el primero en compartir tu experiencia. No añadimos opiniones ficticias.','Be the first to share your experience. We do not add fictional reviews.')}</p>}
    {publicData.opinions.map(row=><article key={row.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{c('Conductor · experiencia declarada','Driver · self-reported experience')}</strong><span>{row.rating} / 5</span></div><time className="text-xs text-muted-foreground">{String(row.updated_at).slice(0,10)}</time><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{row.body}</p><a className="mt-3 inline-block text-xs underline" href={`mailto:privacy@mytruckpay.com?subject=${encodeURIComponent('Opinion '+row.id)}`}>{c('Comunicar un problema con esta opinión','Report a problem with this review')}</a></article>)}
    {publicData.count>50&&<p className="text-xs">{c('Mostramos las 50 opiniones más recientes. La media incluye todas las publicadas.','Showing the latest 50 reviews. The average includes all published reviews.')}</p>}
   </>}
  </section>:<section className="rounded-2xl border bg-card p-5"><h2 className="font-heading text-2xl font-semibold">{c('Construimos MyTruckPay contigo','Build MyTruckPay with us')}</h2><p className="mt-2 text-sm leading-6">{c('Cuéntanos qué te resulta útil, qué mejorarías o dónde has encontrado un fallo. Tu mensaje solo lo veréis tú y el equipo de MyTruckPay.','Tell us what helps, what you would improve or where something went wrong. Only you and the MyTruckPay team can see your message.')}</p></section>}
  {mineError?<div role="alert" className="rounded-xl border p-4">{c('No pudimos cargar tu cuenta o tus envíos.','We could not load your account or submissions.')} <button onClick={()=>setRevision(v=>v+1)} className="underline">{c('Reintentar','Retry')}</button></div>:authenticated?<OpinionForm key={tab+company} kind={tab} company={company} current={mine.find(row=>row.kind==='company'&&row.company_slug===company)} onSaved={()=>setRevision(v=>v+1)}/>:<div className="rounded-xl border bg-accent/10 p-5"><p>{c('Entra con tu cuenta para compartir una opinión o enviar una sugerencia.','Sign in to share a review or send a suggestion.')}</p><Link href="/account" className="mt-3 inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground">{c('Entrar o crear cuenta','Sign in or create account')}</Link></div>}
  {authenticated&&<section className="space-y-3" aria-labelledby="my-opinions"><h2 id="my-opinions" className="font-heading text-2xl font-semibold">{c('Mis aportaciones','My contributions')}</h2><p className="text-sm text-muted-foreground">{c('Tus últimos 100 envíos. Las opiniones de empresa publicadas también se retiran al eliminarlas.','Your latest 100 submissions. Deleting a published company review also removes it from public view.')}</p>{mine.length===0?<p>{c('Todavía no has enviado ninguna aportación.','You have not sent any contributions yet.')}</p>:mine.map(row=><article className="rounded-xl border bg-card p-4" key={row.id}><div className="flex flex-wrap justify-between gap-2"><strong>{row.kind==='company'?row.company_name:'MyTruckPay'}</strong><span className="text-xs">{statuses[row.status]}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-sm">{row.body}</p><div className="mt-3 flex flex-wrap gap-3">{row.kind==='company'&&<button className="min-h-11 underline" onClick={()=>{setTab('company');selectCompany(row.company_slug!);}}>{c('Editar mi opinión','Edit my review')}</button>}{confirmDelete===row.id?<><span className="self-center text-sm">{c('¿Eliminar esta aportación?','Delete this contribution?')}</span><button disabled={!!deleting} className="min-h-11 text-destructive underline" onClick={()=>void remove(row.id)}>{c('Confirmar eliminación','Confirm deletion')}</button><button disabled={!!deleting} className="min-h-11 underline" onClick={()=>setConfirmDelete('')}>{c('Cancelar','Cancel')}</button></>:<button className="min-h-11 underline" onClick={()=>setConfirmDelete(row.id)}>{c('Eliminar','Delete')}</button>}</div></article>)}{deleteError&&<p role="alert">{c('No se pudo eliminar. Inténtalo de nuevo.','Could not delete. Please retry.')}</p>}</section>}
 </div>;
}

function OpinionForm({kind,company,current,onSaved}:{kind:'company'|'platform';company:string;current?:OpinionRecord;onSaved:()=>void}) {
 const {locale}=useT();const es=locale==='es';const c=(a:string,b:string)=>es?a:b;
 const existing=kind==='company'?current:undefined;
 const [body,setBody]=useState(existing?.body??'');const [rating,setRating]=useState(existing?.rating?.toString()??'');
 const [category,setCategory]=useState('idea');const [consent,setConsent]=useState(false);const [experience,setExperience]=useState(false);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState(false);
 const [submissionId,setSubmissionId]=useState('');
 async function submit(event:FormEvent){
  event.preventDefault();if(busy)return;setBusy(true);setMessage('');setError(false);
  const id=submissionId||crypto.randomUUID();setSubmissionId(id);
  try {
   const r=await fetch('/api/opinions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,kind,companySlug:company,category,rating:rating?Number(rating):null,body,consent,consentVersion:OPINION_CONSENT,experienceConfirmed:experience})});
   if(!r.ok)throw Error(r.status===401?'auth':r.status===429?'limit':'save');
   const result=await r.json();
   setMessage(kind==='company'?(result.status==='approved'?c('Opinión publicada.','Review published.'):result.status==='rejected'?c('No publicada: revisa el contenido y vuelve a enviarlo.','Not published: revise the content and resubmit.'):c('Opinión guardada y pendiente de revisión. Aún no es pública.','Review saved and awaiting moderation. It is not public yet.')):c('Gracias. Tu mensaje privado ha llegado a MyTruckPay.','Thank you. MyTruckPay has received your private message.'));
   setSubmissionId('');setConsent(false);if(kind==='platform'){setBody('');setRating('');}onSaved();
  }catch(e){setError(true);const reason=e instanceof Error?e.message:'';setMessage(reason==='auth'?c('Tu sesión ha terminado. Vuelve a entrar para enviar el mensaje.','Your session expired. Sign in again to submit.'):reason==='limit'?c('Has alcanzado el límite de envíos. Inténtalo más tarde.','Submission limit reached. Try again later.'):c('No se pudo confirmar el envío. Tu texto sigue aquí para reintentarlo.','We could not confirm submission. Your text is still here so you can retry.'));}finally{setBusy(false);}
 }
 const inputClass='mt-2 min-h-12 w-full rounded-lg border bg-background p-3';
 return <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6">
  <h2 className="font-heading text-2xl font-semibold">{kind==='company'?(existing?c('Actualizar mi opinión','Update my review'):c('Compartir mi experiencia','Share my experience')):c('Enviar a MyTruckPay','Send to MyTruckPay')}</h2>
  {kind==='company'&&<p className="text-sm text-muted-foreground">{c('Una opinión por cuenta y empresa. Al actualizarla, volverá a revisión antes de publicarse.','One review per account and company. Updates are reviewed again before publication.')}</p>}
  <fieldset disabled={busy} className="space-y-4">
   {kind==='platform'&&<label className="block text-sm font-medium">{c('¿Qué quieres contarnos?','What would you like to share?')}<select className={inputClass} value={category} onChange={e=>{setCategory(e.target.value);setSubmissionId('');}}><option value="idea">{c('Proponer una mejora','Suggest an improvement')}</option><option value="problem">{c('Avisar de un fallo','Report a problem')}</option><option value="other">{c('Dar mi opinión','Share feedback')}</option></select></label>}
   <label className="block text-sm font-medium">{kind==='company'?c('Valoración general','Overall rating'):c('Tu valoración (opcional)','Your rating (optional)')}<select className={inputClass} required={kind==='company'} value={rating} onChange={e=>{setRating(e.target.value);setSubmissionId('');}}><option value="">{c('Seleccionar','Select')}</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5 · {[c('Muy mala','Very poor'),c('Mala','Poor'),c('Aceptable','Fair'),c('Buena','Good'),c('Muy buena','Very good')][n-1]}</option>)}</select></label>
   <label className="block text-sm font-medium">{kind==='company'?c('Tu experiencia','Your experience'):c('Tu mensaje','Your message')}<textarea className={inputClass+' min-h-40'} required minLength={20} maxLength={2000} value={body} onChange={e=>{setBody(e.target.value);setSubmissionId('');}} placeholder={kind==='company'?c('¿Cómo fue el trato, la puntualidad de los pagos o la organización del trabajo?','How were communication, payment punctuality and work organisation?'):c('Qué ocurrió, en qué pantalla y qué esperabas que pasara…','What happened, on which screen, and what did you expect?')}/></label>
   <p className="text-xs text-muted-foreground">{body.length} / 2000 · {c('Mínimo 20 caracteres. No incluyas nombres de personas, teléfonos, documentos ni datos de tus nóminas.','At least 20 characters. Do not include names of individuals, phone numbers, documents or payslip details.')}</p>
   {kind==='company'&&<label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-5 shrink-0" required checked={experience} onChange={e=>setExperience(e.target.checked)}/>{c('He trabajado en esta empresa y describo mi propia experiencia, con respeto y sin datos personales de terceros.','I have worked for this company and am describing my own experience respectfully, without other people’s personal data.')}</label>}
   <label className="flex items-start gap-3 text-sm"><input type="checkbox" required className="mt-1 size-5 shrink-0" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>{kind==='company'?c('Acepto que mi valoración y comentario se publiquen después de revisarlos, sin mi correo ni mi nombre. MyTruckPay conservará su vínculo con mi cuenta.','I agree to publish my rating and comment after review, without my email or name. MyTruckPay will retain the link to my account.'):c('Acepto enviar este mensaje privado al equipo de MyTruckPay y guardarlo en mi cuenta.','I agree to send this private message to the MyTruckPay team and store it in my account.')} <Link href="/privacy" className="underline">{c('Privacidad','Privacy')}</Link></span></label>
   <button disabled={busy||(kind==='company'&&!company)} className="min-h-12 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50">{busy?c('Guardando…','Saving…'):kind==='company'?c('Enviar para revisión','Submit for review'):c('Enviar mensaje privado','Send private message')}</button>
  </fieldset>
  {message&&<p role={error?'alert':'status'} className="rounded-lg bg-accent/10 p-3 text-sm">{message}</p>}
 </form>;
}
