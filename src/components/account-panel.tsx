"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/language-provider";

export function AccountPanel() {
  const { locale } = useT();
  const es = locale === "es";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => { fetch("/api/account").then(r => r.json()).then(r => setSignedIn(r.account?.email ?? null)).catch(() => {}); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    try {
      const response = await fetch("/api/account/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const body = await response.json(); setMessage(response.ok ? (es ? "Si el correo puede recibir mensajes, el enlace ya va de camino." : body.message) : (body.error ?? "Please try again."));
    } catch { setMessage(es ? "Inténtalo de nuevo." : "Please try again."); } finally { setPending(false); }
  }
  async function signOut() {
    setPending(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setSignedIn(null); window.dispatchEvent(new Event("truckpay-payslips-changed")); router.refresh();
    } catch { setMessage(es ? "No se ha podido cerrar sesión." : "Could not sign out."); } finally { setPending(false); }
  }
  return <section className="rounded-lg border border-border bg-card p-5 space-y-3"><h2 className="font-heading text-2xl">{es ? "Tu cuenta" : "Your account"}</h2>
    {signedIn ? <><p>{es ? `Sesión iniciada como ${signedIn}. Puedes acceder a tus nóminas desde otro dispositivo usando este correo.` : `Signed in as ${signedIn}. Your payslips are available on other devices when you use this email.`}</p><Button variant="outline" disabled={pending} onClick={signOut}>{es ? "Cerrar sesión" : "Sign out"}</Button></>
      : <><p>{es ? "Introduce tu correo para conservar el acceso a estas nóminas o entrar desde otro dispositivo. Te enviaremos un enlace de un solo uso." : "Enter your email to save access to these payslips, or sign back in on another device. We’ll email a one-time link."}</p><p className="text-sm text-muted-foreground">{es ? "Si ya usaste ese correo con otra cuenta, entrarás en esa cuenta; los datos anónimos de este navegador no se fusionarán." : "If this email already has an account, you’ll enter that account; anonymous records in this browser will not be merged."}</p><form onSubmit={submit} className="flex flex-wrap gap-2"><input className="rounded border border-border bg-background p-2" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label={es ? "Correo electrónico" : "Email address"} /><Button disabled={pending} type="submit">{pending ? (es ? "Enviando…" : "Sending…") : (es ? "Enviarme un enlace" : "Email me a sign-in link")}</Button></form></>}
    {message && <p role="status">{message}</p>}
  </section>;
}
