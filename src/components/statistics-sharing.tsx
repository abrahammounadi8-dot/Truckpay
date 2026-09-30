"use client";
import Link from "next/link";
import { useState } from "react";
import { useT } from "./language-provider";
import { STATISTICS_NOTICE_VERSION } from "@/lib/payroll/statistics-sharing";
import { StatisticsReviewNotice } from "./statistics-review-notice";

export function StatisticsSharing({ initialEnabled }: { initialEnabled: boolean }) {
  const { locale } = useT();
  const es = locale === "es";
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState("");
  async function change() {
    if (!enabled && !acknowledged) return;
    setPending(true); setStatus("");
    try {
      const response = await fetch("/api/statistics-sharing", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled, noticeVersion: STATISTICS_NOTICE_VERSION }) });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (typeof result.enabled !== "boolean") throw new Error();
      setEnabled(result.enabled);
      setAcknowledged(false);
      setStatus(result.enabled
        ? (es ? "Autorización de revisión interna guardada. Tu aportación todavía no aparecerá en el buscador; la publicación pública está desactivada." : "Internal review permission saved. Your contribution will not appear in search yet; public publication is disabled.")
        : (es ? "Autorización retirada. Tu análisis privado sigue disponible." : "Permission withdrawn. Your private analysis remains available."));
      window.dispatchEvent(new Event("truckpay-employment-changed"));
    } catch { setStatus(es ? "No se pudo guardar. Inténtalo de nuevo." : "Could not save. Please retry."); }
    finally { setPending(false); }
  }
  return <section className="space-y-3 rounded-lg border p-4">
    <h2 className="text-xl font-semibold">{es ? "Participar en la revisión de estadísticas" : "Join the statistics review"}</h2>
    <p>{es ? "El catálogo es de libre acceso. Aportar tus datos es opcional y no afecta al análisis de tus propias nóminas." : "The catalogue is freely accessible. Contributing is optional and does not affect your private payslip analysis."}</p>
    <StatisticsReviewNotice spanish={es} />
    <Link href="/privacy" className="text-sm underline">{es ? "Leer la política de privacidad" : "Read the privacy notice"}</Link>
    <p className="font-medium">{enabled ? (es ? "Revisión interna autorizada; publicación desactivada" : "Internal review allowed; publication disabled") : (es ? "No participas en esta revisión. Una preferencia anterior no activa este nuevo permiso." : "You are not participating in this review. An earlier preference does not enable this new permission.")}</p>
    <div className="rounded-lg bg-muted p-3 text-sm">
      <p className="font-semibold">{es ? "¿Por qué no aparece mi aportación en el buscador?" : "Why is my contribution missing from search?"}</p>
      <p className="mt-1">{es ? "Este permiso permite revisar tus datos internamente. No activa su publicación ni añade tu participación al buscador. Antes de publicar estadísticas de grupos de conductores se solicitará otro permiso. Tus nóminas y tu perfil siguen disponibles en tu área privada." : "This permission allows internal review of your data. It does not enable publication or add your participation to search. Separate permission will be requested before publishing statistics for groups of drivers. Your payslips and profile remain available in your private area."}</p>
    </div>
    {!enabled && <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} disabled={pending} /><span>{es ? "He leído este aviso y quiero participar voluntariamente en la revisión interna." : "I have read this notice and voluntarily want to join the internal review."}</span></label>}
    <button type="button" disabled={pending || (!enabled && !acknowledged)} onClick={change} className="rounded-lg border px-4 py-3 disabled:opacity-50">{pending ? (es ? "Guardando…" : "Saving…") : enabled ? (es ? "Retirar autorización" : "Withdraw permission") : (es ? "Autorizar revisión interna" : "Allow internal review")}</button>
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
