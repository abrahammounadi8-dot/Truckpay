"use client";
import Link from "next/link";
import { StatisticsSharing } from "./statistics-sharing";
import { useEffect, useRef, useState } from "react";
import { MailCheck, ArrowRight, Clock3, ShieldCheck } from "lucide-react";
import { useT } from "./language-provider";
import { accountCopy } from "@/lib/auth/copy";
import { emailCopy } from "@/lib/auth/email-copy";
import type { DeliveryStatus } from "@/lib/auth/email";

export function AccountPanel({ email, enabled, failed, delivery, callbackURL = "/", sharesStatistics = false, moderator = false }: { email: string | null; enabled: boolean; failed: boolean; delivery: DeliveryStatus; callbackURL?: string; sharesStatistics?: boolean; moderator?: boolean }) {
  const { locale } = useT();
  const c = accountCopy[locale];
  const mail = emailCopy[locale];
  const real = delivery.mode === "resend";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!retryAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  const confirmationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sent) confirmationRef.current?.focus();
  }, [sent]);
  const [error, setError] = useState(failed);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(delivery.trialUsed);
  async function requestLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendLink(String(new FormData(event.currentTarget).get("email") ?? '').trim());
  }
  async function sendLink(address: string) {
    if (pending || Date.now() < retryAt || !delivery.ready || trialUsed) return;
    setPending(true); setError(false); setDeliveryError(null);
    const email = address;
    try {
      const result = await fetch("/api/auth/sign-in/magic-link", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, metadata: { deliveryMode: delivery.mode }, callbackURL, errorCallbackURL: "/account?error=link" }) });
      if (!result.ok) {
        const failure = await result.json().catch(() => ({}));
        if (failure.code === "EMAIL_TRIAL_USED") {
          setTrialUsed(true);
          setDeliveryError(mail.used);
        } else {
          setDeliveryError(failure.code === "EMAIL_NOT_CONFIGURED" ? mail.configure : real ? mail.failed : c.error);
        }
        return;
      }
      setSentTo(typeof email === "string" ? email.trim() : "");
      setSent(true); setSecondsLeft(60); setRetryAt(Date.now() + 60000);
    } catch { setDeliveryError(real ? mail.failed : c.error); } finally { setPending(false); }
  }
  async function signOut() {
    try { sessionStorage.removeItem("truckpay.payslip-draft"); } catch { /* Storage may be disabled. */ }
    setPending(true); setError(false);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error();
      // Full navigation discards private client state from the previous account.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberately discard Next's client router cache at the identity boundary
      window.location.assign("/account");
    } catch { setError(true); setPending(false); }
  }
  async function deleteAccount() {
    setPending(true); setError(false);
    try {
      const response = await fetch("/api/auth/delete-user", {method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:"{}"});
      if (!response.ok) throw new Error();
      try { sessionStorage.removeItem("truckpay.payslip-draft"); } catch { /* Storage may be disabled. */ }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- discard private cached state after deletion
      window.location.assign("/account");
    } catch { setError(true); setPending(false); }
  }
  return <div className="mx-auto max-w-xl space-y-5 px-4 py-10">
    <h1 className="font-heading text-4xl font-semibold">{c.title}</h1>
    {process.env.NODE_ENV !== "production" && <p className="rounded-xl border border-border bg-muted p-4 text-sm">{real ? mail.real : c.local}</p>}
    {delivery.mode === "simulated" && <p className="text-sm">{mail.simulation} {mail.configure}</p>}
    {(!delivery.ready || trialUsed) && !email && <p id="email-unavailable" role="status" className="rounded-xl border-2 border-accent bg-accent/10 p-4 font-medium">{trialUsed ? mail.used : mail.configure}</p>}
    {!enabled ? <p role="alert">{c.disabled}</p> : email ? <>
      <p>{real ? mail.verified : c.signedIn}: <strong>{email}</strong></p>
      <Link href="/" className="inline-block rounded-lg bg-primary px-5 py-3 text-primary-foreground">{c.continue}</Link>
      <button type="button" onClick={signOut} disabled={pending} className="ml-3 rounded-lg border px-4 py-3">{pending ? c.pending : c.signOut}</button>
      {moderator && <Link href="/moderation" className="block rounded-lg border border-accent bg-accent/10 px-5 py-3 font-semibold">{locale === "es" ? "Revisar comentarios" : "Review comments"}</Link>}
      <StatisticsSharing initialEnabled={sharesStatistics} />
      <div className="mt-6 rounded-lg border p-4">
        <button disabled={pending} onClick={() => setConfirmDelete(true)} className="text-destructive underline">{locale === "es" ? "Eliminar mi cuenta" : "Delete my account"}</button>
        {confirmDelete && <div className="mt-3 space-y-3"><p>{locale === "es" ? "Se eliminarán tu cuenta, tus nóminas y tu perfil. No podrás recuperarlos desde la aplicación. Si tu sesión es antigua, vuelve a entrar con un enlace nuevo antes de confirmar." : "Your account, payslips and profile will be deleted. You cannot restore them from the app. If your session is old, sign in with a new link before confirming."}</p><button disabled={pending} onClick={deleteAccount} className="rounded border px-4 py-2 text-destructive">{locale === "es" ? "Confirmar eliminación" : "Confirm deletion"}</button><button disabled={pending} onClick={() => setConfirmDelete(false)} className="ml-3 underline">{locale === "es" ? "Cancelar" : "Cancel"}</button></div>}
      </div>
    </> : !sent && <>
      <p>{c.intro}</p>
      <form onSubmit={requestLink} className="space-y-4">
        <label className="block" htmlFor="account-email">{c.email}</label>
        <input disabled={pending || !delivery.ready || trialUsed} aria-describedby={!delivery.ready || trialUsed ? "email-unavailable" : undefined} id="account-email" name="email" type="email" autoComplete="email" required maxLength={254} className="w-full rounded-lg border border-border bg-background p-3" />
        <div className="flex flex-wrap gap-3">
          <button disabled={pending || !delivery.ready || trialUsed || secondsLeft > 0} className="rounded-lg bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">{pending ? c.pending : secondsLeft > 0 ? (locale === 'es' ? 'Espera ' : 'Wait ') + secondsLeft + ' s' : c.send}</button>
          <button disabled={pending || !delivery.ready || trialUsed} className="rounded-lg border border-border px-5 py-3 disabled:opacity-50">{c.recover}</button>
        </div>
      </form>
    </>}
    {sent && <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5">
      <div ref={confirmationRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="relative border-b-4 border-accent bg-primary px-6 py-8 text-primary-foreground outline-none sm:px-8">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><MailCheck className="size-9" aria-hidden="true" /></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">{locale === 'es' ? 'Tu espacio personal te espera' : 'Your personal space awaits'}</p>
        <h2 className="mt-2 font-heading text-4xl font-semibold">{real ? (locale === 'es' ? 'Revisa tu correo' : 'Check your inbox') : mail.simulation}</h2>
        <p className="mt-3 text-sm leading-6 text-primary-foreground/85">{real ? (locale === 'es' ? 'Te hemos enviado un enlace para entrar de forma segura.' : 'We have sent you a link to sign in securely.') : c.sent}</p>
        {real && <p className="mt-4 break-all rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 font-semibold">{sentTo}</p>}
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        {real && <>
          <ol className="space-y-4">{(locale === 'es' ? ['Abre el mensaje de MyTruckPay.', 'Pulsa el enlace para entrar a tu cuenta.'] : ['Open the email from MyTruckPay.', 'Follow the link to sign in to your account.']).map((step, i) => <li key={step} className="flex items-center gap-3 text-sm"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/20 font-semibold">{i + 1}</span>{step}</li>)}</ol>
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4 text-sm"><Clock3 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true"/><p>{locale === 'es' ? 'El enlace caduca en 10 minutos y solo se puede usar una vez.' : 'The link expires in 10 minutes and can only be used once.'}</p></div>
          <div><h3 className="font-semibold">{locale === 'es' ? '¿No encuentras el mensaje?' : 'Cannot find the email?'}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{locale === 'es' ? 'Espera un momento y revisa Spam o Correo no deseado. Comprueba también que el correo de arriba esté bien escrito.' : 'Give it a moment and check your spam or junk folder. Also check that the email address above is correct.'}</p></div>
        </>}
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => void sendLink(sentTo)} disabled={pending || secondsLeft > 0 || !delivery.ready || trialUsed} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50">{pending ? c.pending : secondsLeft > 0 ? (locale === 'es' ? 'Reenviar en ' : 'Resend in ') + secondsLeft + ' s' : locale === 'es' ? 'Reenviar enlace' : 'Resend link'}<ArrowRight className="size-4" aria-hidden="true"/></button>
          <button type="button" disabled={pending} onClick={() => { setSent(false); setDeliveryError(null); }} className="min-h-12 rounded-xl border px-5 py-3 text-sm font-medium">{locale === 'es' ? 'Cambiar correo' : 'Change email'}</button>
        </div>
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" aria-hidden="true"/>{locale === 'es' ? 'Sin contraseñas. Tus nóminas siguen siendo privadas.' : 'No passwords. Your payslips stay private.'}</p>
      </div>
    </section>}
    {deliveryError && <p role="alert" className="text-destructive">{deliveryError}</p>}
    {error && <p role="alert" className="text-destructive">{c.error}</p>}
    {process.env.NODE_ENV !== "production" && <p className="text-sm text-muted-foreground">{c.legacy}</p>}
  </div>;
}
