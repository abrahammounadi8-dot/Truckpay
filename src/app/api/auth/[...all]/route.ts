import { getLocalAuth, getDeliveryStatus, localAuthOrigin } from "@/lib/auth/server";
import { localAuthEnabled } from "@/lib/auth/config";

export const runtime = "nodejs";
async function handle(request: Request) {
  if (!localAuthEnabled()) return Response.json({ error: "Authentication has not been configured for production." }, { status: 503 });
  if (request.headers.get("host") !== new URL(localAuthOrigin).host) return Response.json({ error: "Use the configured MyTruckPay domain." }, { status: 403 });
  // Next's development server may construct request.url using its bind address.
  const incoming = new URL(request.url);
  if (request.method === "POST" && incoming.pathname === "/api/auth/sign-in/magic-link") {
    const status = await getDeliveryStatus();
    if (!status.ready) return Response.json({ code: status.trialUsed ? "EMAIL_TRIAL_USED" : "EMAIL_NOT_CONFIGURED" }, { status: status.trialUsed ? 409 : 503 });
    let mode: unknown;
    try { mode = (await request.clone().json()).metadata?.deliveryMode ?? "simulated"; }
    catch { return Response.json({ code: "INVALID_REQUEST" }, { status: 400 }); }
    if (mode !== status.mode) return Response.json({ code: "EMAIL_MODE_CHANGED" }, { status: 409 });
  }
  const canonical = new Request(new URL(incoming.pathname + incoming.search, localAuthOrigin), request);
  const response = await (await getLocalAuth()).handler(canonical);
  if (response.ok && ["/api/auth/sign-out", "/api/auth/delete-user"].includes(incoming.pathname)) {
    for (const name of ["mtp_gmail_grant", "mtp_gmail_state"]) response.headers.append("Set-Cookie", name + "=; Path=/api/gmail; Max-Age=0; HttpOnly; SameSite=Lax" + (localAuthOrigin.startsWith("https:") ? "; Secure" : ""));
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
export const GET = handle;
export const POST = handle;
