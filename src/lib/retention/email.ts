import type { RetentionMail } from "./service";

export function retentionEmail(origin: string) {
  const url = new URL("/account", origin);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid account origin.");
  return {
    subject: "MyTruckPay: keep your inactive account / conserva tu cuenta",
    text: `Your MyTruckPay account has been inactive for 24 months. Your account, saved payslips and profile are scheduled for deletion no earlier than 30 days after delivery of this notice. Sign in at ${url.href} to keep them and cancel deletion. You can review your payslips or request a copy at privacy@mytruckpay.com before deletion. The public catalogue remains free to access. Copies may remain within provider backup retention periods. This is an account notice, not marketing.\n\nTu cuenta de MyTruckPay lleva 24 meses sin actividad. La cuenta, las nóminas guardadas y el perfil se eliminarán como pronto 30 días después de la entrega de este aviso. Entra en ${url.href} para conservarlos y cancelar el borrado. Puedes consultar tus nóminas o solicitar una copia a privacy@mytruckpay.com antes del borrado. El catálogo público sigue siendo de libre acceso. Las copias pueden permanecer durante los plazos de conservación del proveedor. Este es un aviso de cuenta, no publicidad.\n\nIbrahim Mounadi Boujanna · MyTruckPay · Ireland`,
  };
}

export function resendRetentionMail(env: Record<string, string | undefined> = process.env, transport: typeof fetch = fetch): RetentionMail {
  const key = env.RESEND_API_KEY, from = env.MTP_AUTH_EMAIL_FROM, origin = env.MTP_AUTH_URL;
  if (!key || !from || !origin) throw new Error("Retention email configuration missing.");
  const content = retentionEmail(origin);
  async function request(path: string, init: RequestInit = {}, requestKey = key) {
    const response = await transport(`https://api.resend.com${path}`, { ...init, redirect: "error", signal: AbortSignal.timeout(10_000), headers: { Authorization: `Bearer ${requestKey}`, "Content-Type": "application/json", ...init.headers } });
    if (!response.ok) throw new Error("Retention email provider unavailable.");
    return response.json();
  }
  return {
    async send(email, notice) {
      const data = await request("/emails", { method: "POST", headers: { "Idempotency-Key": `mtp-retention/${notice}` }, body: JSON.stringify({ from: `MyTruckPay <${from}>`, to: [email], ...content }) });
      if (typeof data.id !== "string" || !data.id) throw new Error("Missing delivery reference.");
      return data.id;
    },
    async delivered(id) {
      const data = await request(`/emails/${encodeURIComponent(id)}`, {}, env.RESEND_RETENTION_API_KEY || key);
      return data.id === id && data.last_event === "delivered";
    },
  };
}
