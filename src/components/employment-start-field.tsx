"use client";
import { useRouter } from "next/navigation";
import { tenureBandLabel } from "@/lib/payroll/employment-month";
import { tenureBandFromMonths } from "@/lib/payroll/tenure";

import { useEffect, useId, useState } from "react";
import { useT } from "./language-provider";

type Props = { countryCode?: "IE" | "US"; employerName: string; asOf?: string; onReady?: (ready: boolean) => void };
export function EmploymentStartField(props: Props) {
  return <EmploymentStartEditor key={`${props.countryCode ?? ""}|${props.employerName}|${props.asOf ?? ""}`} {...props} />;
}
function EmploymentStartEditor({ employerName, asOf, onReady, countryCode }: Props) {
  const router = useRouter();
  const { locale } = useT(); const es = locale === "es"; const id = useId();
  const [month, setMonth] = useState(""); const [savedMonth, setSavedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false); const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false; onReady?.(false);
    if (!employerName.trim()) return;
    const params = new URLSearchParams({ ...(countryCode ? { countryCode } : {}), employer: employerName, ...(asOf ? { asOf } : {}) });
    fetch(`/api/employment-start?${params}`, { credentials: "same-origin" }).then(async r => { const d = await r.json(); if (!r.ok) throw Error(d.error ?? "No se pudo consultar el inicio."); return d; }).then(d => {
      if (cancelled) return;
      setMonth(d.startMonth ?? ""); setSavedMonth(d.valid ? d.startMonth : null); setMonths(d.tenure?.months ?? null);
      setError(d.error ?? null); setEditing(!d.valid); onReady?.(!!d.valid);
    }).catch(e => { if (!cancelled) { setError(e.message); setSavedMonth(null); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [employerName, asOf, onReady, countryCode]);
  async function save() {
    setPending(true); setError(null);
    try {
      const r = await fetch("/api/employment-start", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ countryCode, employerName, startMonth: month, asOf }) });
      const d = await r.json(); if (!r.ok) throw Error(d.error ?? "No se pudo guardar.");
      setSavedMonth(month); setEditing(false); setMonths(d.tenure?.months ?? null); onReady?.(true);
      window.dispatchEvent(new Event("truckpay-employment-changed"));
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); } finally { setPending(false); }
  }
  if (!employerName.trim()) return null;
  return <div className="rounded-xl border border-accent/50 bg-accent/10 p-4">
    <p className="font-semibold">{es ? "¿Cuándo empezaste a trabajar en esta empresa?" : "When did you start working for this employer?"}</p>
    <p className="mt-1 text-sm">{employerName}</p>
    {loading ? <p className="mt-2 text-sm">{es ? "Consultando…" : "Loading…"}</p> : savedMonth && !editing ? <div className="mt-2 flex flex-wrap items-center gap-3">
      <p className="text-sm">{savedMonth.slice(5)}/{savedMonth.slice(0, 4)} · {es ? "Declarado por ti" : "Self-declared"}{months != null ? ` · ${months} ${es ? (asOf ? "meses a la fecha de esta nómina" : "meses hasta este mes") : (asOf ? "months at this payslip date" : "months as of this month")}` : ""}{months != null ? ` · ${tenureBandLabel(tenureBandFromMonths(months), es)}` : ""}</p>
      <button type="button" className="text-sm underline" onClick={() => { setEditing(true); onReady?.(false); }}>{es ? "Corregir" : "Correct"}</button>
    </div> : <div className="mt-3 space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{es ? "Mes y año de inicio (obligatorio)" : "Start month and year (required)"}</label>
      <input id={id} type="month" value={month} max={asOf?.slice(0, 7) || new Date().toISOString().slice(0, 7)} onChange={e => setMonth(e.target.value)} className="rounded-lg border border-border bg-background p-2" disabled={pending} />
      <button type="button" disabled={pending || !month} onClick={save} className="ml-2 rounded-lg bg-accent px-3 py-2 font-medium text-accent-foreground disabled:opacity-50">{pending ? "…" : es ? "Guardar inicio" : "Save start month"}</button>
      <p className="text-xs text-muted-foreground">{es ? "Solo mes y año, sin día exacto. Lo guardamos para esta empresa y calculamos la antigüedad en cada nómina. Es un dato declarado, no una comprobación documental." : "Month and year only. Saved for this employer; tenure is calculated at each payslip date. Self-declared, not document-verified."}</p>
    </div>}
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </div>;
}
