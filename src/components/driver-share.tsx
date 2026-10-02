"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { QrCode, X } from "lucide-react";
import { useT } from "./language-provider";
const url = "https://mytruckpay.com/";
export function DriverShare() {
  const { locale } = useT();
  const es = locale === "es";
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus(es ? "Enlace copiado" : "Link copied"); }
    catch { setStatus(es ? "Puedes copiar la dirección que aparece debajo." : "You can copy the address below."); }
  }
  async function share() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: "MyTruckPay", text: es ? "Mira MyTruckPay para conductores." : "Take a look at MyTruckPay for drivers.", url }); }
    catch (error) { if (!(error instanceof Error && error.name === "AbortError")) await copy(); }
  }
  return <>
    <div className="border-t border-primary-foreground/15"><div className="mx-auto max-w-6xl px-4 py-1"><button type="button" onClick={() => { setStatus(""); dialog.current?.showModal(); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-primary-foreground/10"><QrCode className="size-5" aria-hidden="true" />{es ? "Enseñar a otro conductor" : "Show another driver"}</button></div></div>
    <dialog ref={dialog} aria-labelledby="driver-share-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-sm overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl backdrop:bg-black/70">
      <div className="flex items-center justify-between gap-3"><h2 id="driver-share-title" className="font-heading text-xl font-semibold">{es ? "Comparte MyTruckPay" : "Share MyTruckPay"}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label={es ? "Cerrar" : "Close"} className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted"><X aria-hidden="true" /></button></div>
      <p className="mt-2 text-sm text-muted-foreground">{es ? "Enséñale este QR. Lo escanea con la cámara y entra directamente." : "Show this QR. Scan it with a phone camera to open the website."}</p>
      <Image src="/share-qr.svg" alt={es ? "QR para abrir mytruckpay.com" : "QR to open mytruckpay.com"} width={330} height={330} className="mx-auto mt-4 h-auto w-full rounded-lg bg-white" unoptimized />
      <a href={url} className="mt-3 block text-center font-semibold underline">mytruckpay.com</a>
      <div className="mt-4 grid gap-2"><button type="button" onClick={share} className="min-h-12 rounded-xl bg-accent px-4 font-semibold text-accent-foreground">{es ? "Compartir enlace" : "Share link"}</button><button type="button" onClick={copy} className="min-h-12 rounded-xl border border-border px-4 font-semibold">{es ? "Copiar enlace" : "Copy link"}</button></div>
      <p role="status" className="mt-2 min-h-5 text-center text-sm">{status}</p>
    </dialog>
  </>;
}
