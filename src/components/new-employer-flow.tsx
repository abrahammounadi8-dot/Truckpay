"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PayslipForm } from "./payslip-form";
import { useT } from "./language-provider";
import { Button } from "./ui/button";
import { resolveEmployer } from "@/lib/payroll/employer";
export function NewEmployerFlow({ defaultEmployer }: { defaultEmployer?: string }) {
 const {locale} = useT(); const es = locale === "es"; const router = useRouter();
 const [reading,setReading] = useState(false);
 const [queue,setQueue] = useState<File[]>([]);
 const [needsDetails,setNeedsDetails] = useState(false);
 const [notice,setNotice] = useState<string|null>(null);
 const [processed,setProcessed] = useState(0);
 const [companyName,setCompanyName] = useState(defaultEmployer || "");
 const summaryRef = useRef<HTMLElement>(null);
 const [items,setItems] = useState<Record<string,unknown>[]>([]);
 const [step,setStep] = useState(0); const [month,setMonth] = useState(""); const [error,setError] = useState<string|null>(null); const [busy,setBusy] = useState(false);
 const employer = typeof items[0]?.employerName === "string" ? items[0].employerName : companyName;
 const frequency = items[0]?.payFrequency;
 const groupFrequency = frequency === "weekly" || frequency === "fortnightly" || frequency === "monthly" ? frequency : "unknown";
 const visibleCount = items.length;
 useEffect(() => {
  if (!step && !error && !processed) return;
  const frame = requestAnimationFrame(() => {
   summaryRef.current?.focus({ preventScroll: true });
   summaryRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  });
  return () => cancelAnimationFrame(frame);
 }, [step, error, processed]);
 function add(item: Record<string,unknown>) {
  if(items.length >= 3) return;
  const name = typeof item.employerName === "string" ? item.employerName : "";
  if(!name.trim()) {setError(es?"Indica la empresa de esta nómina.":"Enter the employer on this payslip.");return;}
  if(items.length && resolveEmployer(name).employerSlug !== resolveEmployer(employer).employerSlug) {setError(es?"Las tres nóminas deben pertenecer a la misma empresa.":"All three payslips must be from the same employer.");return;}
  if(items.some(previous => previous.paymentDate === item.paymentDate && previous.netPay === item.netPay && previous.grossPay === item.grossPay)) {setError(es?"Esta nómina ya está en el grupo.":"This payslip is already in the set.");return;}
  setQueue(previous=>previous.slice(1));setNotice(null);setNeedsDetails(false);setItems(previous => [...previous,item]);setStep(s=>s+1);setError(null);
 }
 async function save() {
  if(items.length !== 3 || !month || busy) return;
  setBusy(true);setError(null);
  try {
   const response = await fetch("/api/payslips/batch",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({payslips:items,startMonth:month})});
   const data = await response.json();if(!response.ok)throw Error(data.error || "No se pudo guardar.");
   window.dispatchEvent(new Event("truckpay-payslips-changed"));router.push("/payslips#summary");router.refresh();
  } catch(e) {setError(e instanceof Error?e.message:"No se pudo guardar.");setBusy(false);}
 }
 const employmentStartFields = <>
   <label htmlFor="new-employer-start" className="block text-sm font-medium">{es?"Mes y año en que empezaste (obligatorio)":"Start month and year (required)"}</label>
   <input id="new-employer-start" type="month" value={month} max={new Date().toISOString().slice(0,7)} disabled={busy} onChange={e=>setMonth(e.target.value)} className="min-h-11 rounded-lg border border-border bg-background p-3 text-base"/>
 </>;
 return <div className="space-y-6">
  <section ref={summaryRef} tabIndex={-1} className="outline-none scroll-mt-28 rounded-2xl border border-accent/40 bg-accent/10 p-5">
   <h2 className="font-heading text-2xl font-semibold">{es?"Prepara las tres nóminas":"Prepare three payslips"} · {visibleCount}/3</h2>
   <p className="mt-2 text-sm leading-6">{es?"Sube o importa tres nóminas consecutivas de la misma empresa. Los datos se guardarán juntos cuando confirmes; si recargas antes, tendrás que volver a prepararlos.":"Upload or import three consecutive payslips from one employer. They are saved together when you confirm; reloading before then clears this draft."}</p>
   {queue.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><span>{es?"Importando":"Importing"}: {queue[0].name} · {queue.length} {es?"pendientes":"remaining"}</span><Button type="button" variant="outline" disabled={reading} onClick={()=>{setQueue(previous=>previous.slice(1));setNeedsDetails(false);setNotice(null);setError(null);setStep(value=>value+1);}}>{es?"Omitir este archivo":"Skip this file"}</Button></div>}
   {notice && <p role="status" className="mt-3 rounded-lg bg-card p-3 text-sm">{notice}</p>}
   {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
   <progress className="mt-4 h-2 w-full accent-amber-500" value={visibleCount} max={3} aria-label={es?"Nóminas preparadas":"Prepared payslips"}/>
   {items.length > 0 && <ul className="mt-4 space-y-2">{items.map((item,index)=><li key={index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card p-3 text-sm"><span>{String(item.employerName)} · {String(item.paymentDate)}</span><button type="button" disabled={busy} className="underline" onClick={()=>{setItems(items.filter((_,i)=>i!==index));setError(null);}}>{es?"Quitar":"Remove"}</button></li>)}</ul>}
  </section>
  {!needsDetails && <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
   <label htmlFor="new-employer-name" className="block text-sm font-medium">{es?"Nombre de empresa":"Company name"}</label>
   <input id="new-employer-name" value={employer} readOnly={items.length > 0} disabled={busy} onChange={e=>setCompanyName(e.target.value)} placeholder={es?"Se completa al leer la nómina":"Filled from your payslip"} className="min-h-11 w-full rounded-lg border border-border bg-background p-3 text-base"/>
   {employmentStartFields}
   <p className="text-sm text-muted-foreground">{es?"Al confirmar, comprobaremos la continuidad de las tres nóminas y mostraremos el resumen de esta empresa.":"On confirmation, we check the three consecutive periods and display this employer’s summary."}</p>
   {items.length === 3 && <Button type="button" disabled={busy || !month} onClick={save} className="bg-accent text-accent-foreground hover:bg-accent/90">{busy?"…":es?"Confirmar y guardar las tres nóminas":"Confirm and save three payslips"}</Button>}
  </section>}
  {items.length < 3 && <PayslipForm key={step} defaultEmployer={employer} defaultPayFrequency={groupFrequency} initialFile={queue[0]} onReadingChange={setReading} maxImports={3-items.length} onImportFiles={files=>{setQueue(files.slice(0,3-items.length));setNeedsDetails(false);setNotice(null);setStep(value=>value+1);}} onPrepared={add} autoPrepare onNeedsDetails={setNeedsDetails} employmentStartFields={employmentStartFields} onProcessed={message=>{setNotice(message);setProcessed(value=>value+1);}}/>}

 </div>;
}
