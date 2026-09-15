"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/language-provider";
import { Button } from "@/components/ui/button";

export function WipeSession() {
  const router = useRouter();
  const { t } = useT();
  const [pending, setPending] = useState(false);

  async function onWipe() {
    setPending(true);
    await fetch("/api/session", { method: "DELETE", credentials: "same-origin" });
    window.dispatchEvent(new Event("truckpay-payslips-changed"));
    router.push("/payslips");
    router.refresh();
    setPending(false);
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onWipe}>
      {pending ? t("wipe.wiping") : t("wipe.label")}
    </Button>
  );
}
