import { accessEmailTemplate } from "@/lib/auth/email-template";

/** A static design preview: no authentication token, database access or email delivery. */
export function GET() {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const mail = accessEmailTemplate("#vista-previa-sin-acceso");
  const html = mail.html.replace("cid:mtp-brand", `data:image/png;base64,${mail.attachments[0].content}`)
    .replace('<table role="presentation" width="100%"', '<p style="text-align:center;padding:12px;font:14px Arial">Vista previa · No envía correos · El botón no inicia sesión</p><table role="presentation" width="100%"');
  return new Response(html, { headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  } });
}
