"use client";
import Link from "next/link";
import { StatisticsSharing } from "./statistics-sharing";
import { useEffect, useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { useT } from "./language-provider";
import { accountCopy } from "@/lib/auth/copy";
import { emailCopy } from "@/lib/auth/email-copy";
import type { DeliveryStatus } from "@/lib/auth/email";

export function AccountPanel({ email, enabled, failed, delivery, callbackURL = "/", sharesStatistics = false }: { email: string | null; enabled: boolean; failed: boolean; delivery: DeliveryStatus; callbackURL?: string; sharesStatistics?: boolean }) {
  const { locale } = useT();
  const c = accountCopy[locale];
  const mail = emailCopy[locale];
  const real = delivery.mode === "resend";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const confirmationRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sent) confirmationRef.current?.focus();
  }, [sent]);
  const [error, setError] = useState(failed);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(delivery.trialUsed);
  async function requestLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(false); setDeliveryError(null); setSent(false);
    const email = new FormData(event.currentTarget).get("email");
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
      setSent(true);
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
      <StatisticsSharing initialEnabled={sharesStatistics} />
      <div className="mt-6 rounded-lg border p-4">
        <button disabled={pending} onClick={() => setConfirmDelete(true)} className="text-destructive underline">{locale === "es" ? "Eliminar mi cuenta" : "Delete my account"}</button>
        {confirmDelete && <div className="mt-3 space-y-3"><p>{locale === "es" ? "Se eliminarán tu cuenta, tus nóminas y tu perfil. No podrás recuperarlos desde la aplicación. Si tu sesión es antigua, vuelve a entrar con un enlace nuevo antes de confirmar." : "Your account, payslips and profile will be deleted. You cannot restore them from the app. If your session is old, sign in with a new link before confirming."}</p><button disabled={pending} onClick={deleteAccount} className="rounded border px-4 py-2 text-destructive">{locale === "es" ? "Confirmar eliminación" : "Confirm deletion"}</button><button disabled={pending} onClick={() => setConfirmDelete(false)} className="ml-3 underline">{locale === "es" ? "Cancelar" : "Cancel"}</button></div>}
      </div>
    </> : <>
      <p>{c.intro}</p>
      <form onSubmit={requestLink} className="space-y-4">
        <label className="block" htmlFor="account-email">{c.email}</label>
        <input disabled={pending || !delivery.ready || trialUsed || (real && sent)} aria-describedby={!delivery.ready || trialUsed ? "email-unavailable" : undefined} id="account-email" name="email" type="email" autoComplete="email" required maxLength={254} className="w-full rounded-lg border border-border bg-background p-3" />
        <div className="flex flex-wrap gap-3">
          <button disabled={pending || !delivery.ready || trialUsed || (real && sent)} className="rounded-lg bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">{pending ? c.pending : real && sent ? mail.sentTitle : c.send}</button>
          <button disabled={pending || !delivery.ready || trialUsed || (real && sent)} className="rounded-lg border border-border px-5 py-3 disabled:opacity-50">{c.recover}</button>
        </div>
      </form>
    </>}
    {sent && <div ref={confirmationRef} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" className="rounded-xl border-2 border-accent bg-accent/10 p-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <div className="flex items-start gap-3">
        <CircleCheck className="mt-0.5 size-6 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0 space-y-2">
          <h2 className="font-heading text-2xl font-semibold">{real ? mail.sentTitle : mail.simulation}</h2>
          {real && <p className="break-all font-semibold">{sentTo}</p>}
          <p className="text-sm leading-6">{real ? mail.sentHelp : c.sent}</p>
        </div>
      </div>
    </div>}
    {deliveryError && <p role="alert" className="text-destructive">{deliveryError}</p>}
    {error && <p role="alert" className="text-destructive">{c.error}</p>}
    {process.env.NODE_ENV !== "production" && <p className="text-sm text-muted-foreground">{c.legacy}</p>}
  </div>;
}
