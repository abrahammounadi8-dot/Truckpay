"use client";

import { accountCopy } from "@/lib/auth/copy";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { deleteSession } from "@/lib/payroll/delete-session";

export function WipeSession() {
  const router = useRouter();
  const { t, locale } = useT();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);
  const es = locale === "es";

  async function onWipe() {
    if (pending) return;
    try { sessionStorage.removeItem("truckpay.payslip-draft"); } catch { /* Storage may be disabled. */ }
    setPending(true);
    setError(false);
    try {
      await deleteSession();
      window.dispatchEvent(new Event("truckpay-payslips-changed"));
      setConfirming(false);
      router.push("/payslips");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      {confirming ? <>
        <p>{es ? "Se borrarán todas las nóminas y el perfil vinculados a esta cuenta. No podrás recuperarlos desde la aplicación." : "All payslips and the profile linked to this account will be deleted. You cannot restore them from the app."}</p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="destructive" disabled={pending} onClick={onWipe}>{pending ? t("wipe.wiping") : es ? "Confirmar borrado definitivo" : "Confirm permanent deletion"}</Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => { setConfirming(false); setError(false); }}>{es ? "Cancelar" : "Cancel"}</Button>
        </div>
      </> : <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>{accountCopy[locale].deleteData}</Button>}
      {error && <p role="alert" className="text-sm text-destructive">{es ? "No se ha podido confirmar el borrado. Comprueba la conexión y vuelve a intentarlo." : "Deletion could not be confirmed. Check your connection and try again."}</p>}
    </div>
  );
}
