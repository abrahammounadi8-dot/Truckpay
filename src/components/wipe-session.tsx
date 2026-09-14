"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WipeSession() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onWipe() {
    setPending(true);
    await fetch("/api/session", { method: "DELETE" });
    window.dispatchEvent(new Event("truckpay-payslips-changed"));
    router.push("/payslips");
    router.refresh();
    setPending(false);
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onWipe}>
      {pending ? "Wiping…" : "Delete my payslips on this device"}
    </Button>
  );
}
