"use client";
import Link from "next/link";
import { useState } from "react";
import { useT } from "./language-provider";
import { STATISTICS_NOTICE_VERSION } from "@/lib/payroll/statistics-sharing";

export function StatisticsSharing({ initialEnabled }: { initialEnabled: boolean }) {
  const { locale } = useT();
  const es = locale === "es";
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  async function change() {
    setPending(true); setStatus("");
    try {
      const response = await fetch("/api/statistics-sharing", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled, noticeVersion: STATISTICS_NOTICE_VERSION }) });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (typeof result.enabled !== "boolean") throw new Error();
      setEnabled(result.enabled);
      setStatus(es ? "Preferencia guardada." : "Preference saved.");
      window.dispatchEvent(new Event("truckpay-employment-changed"));
    } catch { setStatus(es ? "No se pudo guardar. Inténtalo de nuevo." : "Could not save. Please retry."); }
    finally { setPending(false); }
  }
  return <section className="space-y-3 rounded-lg border p-4">
    <h2 className="text-xl font-semibold">{es ? "Participar en estadísticas" : "Contribute to statistics"}</h2>
    <p>{es ? "El catálogo es de libre acceso. Aportar tus datos es opcional y no afecta al análisis de tus propias nóminas." : "The catalogue is freely accessible. Contributing is optional and does not affect your private payslip analysis."}</p>
    <p className="text-sm font-medium">{es ? "La publicación está en pausa mientras revisamos las protecciones de privacidad. Tu preferencia no activa la publicación; puedes retirarla en cualquier momento." : "Publication is paused while we review privacy protections. Your preference does not enable publication; you can withdraw it at any time."}</p>
    <p className="text-sm">{es ? "La preferencia se conserva, pero actualmente no publicamos cifras ni tamaños de muestra procedentes de tus nóminas. Antes de reactivar las estadísticas revisaremos las condiciones de participación." : "Your preference is retained, but we currently publish no figures or sample counts from your payslips. We will review the participation conditions before reactivating statistics."}</p>
    <p className="text-sm">{es ? "Puedes retirar tu autorización aquí. Tus datos dejarán de incluirse en los nuevos cálculos; no podemos retirar copias que terceros ya hayan guardado." : "You can withdraw here. Your data will be excluded from new calculations; we cannot recall copies already saved by third parties."}</p>
    <Link href="/privacy" className="text-sm underline">{es ? "Leer la política de privacidad" : "Read the privacy notice"}</Link>
    <p className="font-medium">{enabled ? (es ? "Participación activada" : "Sharing enabled") : (es ? "No participas en las estadísticas" : "You are not contributing to statistics")}</p>
    <button type="button" disabled={pending} onClick={change} className="rounded-lg border px-4 py-3 disabled:opacity-50">{pending ? (es ? "Guardando…" : "Saving…") : enabled ? (es ? "Retirar autorización" : "Withdraw permission") : (es ? "Autorizar mi participación" : "Allow my contribution")}</button>
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
