import { gmailReturnPath, gmailReturnLocation } from "@/lib/gmail/return-path";
import { cookies } from "next/headers";
import { localAuthOrigin } from "@/lib/auth/server";
import { privateApiIdentity, privateJson, readUserId } from "@/lib/payroll/session";
import { authorization, downloadPdf, exchange, gmailConfig, GmailError, listPdfs, revoke, seal, unseal, type GmailGrant, type GmailState } from "@/lib/gmail/client";

export const runtime = "nodejs";
const GRANT = "mtp_gmail_grant";
const STATE = "mtp_gmail_state";
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: localAuthOrigin.startsWith("https:"), path: "/api/gmail" };
type Context = { params: Promise<{ action: string }> };

function returnToForm(result: string, destination?: string) {
  return new Response(null, { status: 303, headers: { Location: `${localAuthOrigin}${gmailReturnLocation(destination, result)}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
function errorResponse(error: unknown) {
  const code = error instanceof GmailError ? error.code : "PROVIDER";
  return privateJson({ code }, { status: code === "RECONNECT" ? 401 : code === "PROVIDER" ? 502 : 400 });
}

export async function GET(request: Request, context: Context) {
  const { action } = await context.params;
  const config = gmailConfig(localAuthOrigin);
  const jar = await cookies();
  if (action === "callback") {
    const userId = await readUserId();
    const pending = jar.get(STATE)?.value;
    jar.set(STATE, "", { ...cookieOptions, maxAge: 0 });
    if (!config || !userId) return returnToForm("error");
    const state = unseal<GmailState>(pending, STATE, config.secret, userId);
    const params = new URL(request.url).searchParams;
    if (!state || state.nonce !== params.get("state") || params.has("error") || !params.get("code")) return returnToForm("error");
    try {
      const grant = await exchange(config, state, params.get("code")!);
      const encrypted = seal(grant, GRANT, config.secret);
      if (encrypted.length > 3800) throw new GmailError("PROVIDER");
      jar.set(GRANT, encrypted, { ...cookieOptions, maxAge: Math.floor((grant.expires - Date.now()) / 1000) });
      return returnToForm("connected", state.returnTo);
    } catch { return returnToForm("error", state.returnTo); }
  }
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const grant = config && unseal<GmailGrant>(jar.get(GRANT)?.value, GRANT, config.secret, userId);
  if (action === "status") return privateJson({ configured: Boolean(config), connected: Boolean(grant), email: grant?.email ?? null });
  if (action !== "messages") return privateJson({ code: "NOT_FOUND" }, { status: 404 });
  if (!grant) return privateJson({ code: "RECONNECT" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  try { return privateJson(await listPdfs(grant.token, params.get("search") ?? "", params.get("page") ?? undefined)); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request, context: Context) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const { action } = await context.params;
  const config = gmailConfig(localAuthOrigin);
  if (!config) return privateJson({ code: "NOT_CONFIGURED" }, { status: 503 });
  const jar = await cookies();
  if (action === "connect") {
    const { state, url } = authorization(config, userId);
    const body = await request.json().catch(() => ({}));
    state.returnTo = gmailReturnPath(body?.returnTo);
    jar.set(STATE, seal(state, STATE, config.secret), { ...cookieOptions, maxAge: 600 });
    return privateJson({ url });
  }
  const grant = unseal<GmailGrant>(jar.get(GRANT)?.value, GRANT, config.secret, userId);
  if (action === "disconnect") {
    // Clear local access even if Google's revocation service is unavailable.
    jar.set(GRANT, "", { ...cookieOptions, maxAge: 0 });
    jar.set(STATE, "", { ...cookieOptions, maxAge: 0 });
    try { if (grant) await revoke(grant.token); return privateJson({ disconnected: true, revoked: true }); }
    catch { return privateJson({ disconnected: true, revoked: false }); }
  }
  if (action !== "download") return privateJson({ code: "NOT_FOUND" }, { status: 404 });
  if (!grant) return privateJson({ code: "RECONNECT" }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.messageId !== "string" || typeof body.partId !== "string") throw new GmailError("BAD_REQUEST");
    const bytes = await downloadPdf(grant.token, body.messageId, body.partId);
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=payslip.pdf", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", Vary: "Cookie" } });
  } catch (error) { return errorResponse(error); }
}
