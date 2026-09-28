"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/language-provider";

export function VerifyLink() {
  const { locale } = useT();
  const es = locale === "es";
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function verify() {
    if (!token || pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/account/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      router.replace("/payslips"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not verify link."); setPending(false); }
  }
  return <div className="space-y-4"><Button disabled={!token || pending} onClick={verify}>{pending ? (es ? "Verificando…" : "Verifying…") : (es ? "Confirmar acceso" : "Confirm sign-in")}</Button>{!token && <p role="alert">{es ? "Falta el código del enlace." : "Link is missing its token."}</p>}{error && <p role="alert" className="text-destructive">{error}</p>}</div>;
}
