import { accountSession, discardLoginLink, issueLoginLink, normalizeEmail } from "@/lib/payroll/account";
import { getOrCreateUserId } from "@/lib/payroll/session";
import { contentLengthTooLarge, rateLimit, readBoundedJson, RequestTooLargeError } from "@/lib/http/request-limits";
import { usesDatabase } from "@/lib/persistence/database";

export const runtime = "nodejs";
const generic = { ok: true, message: "If the address can receive email, a sign-in link is on its way." };

export async function POST(request: Request) {
  const limited = rateLimit(request, { scope: "account-email", limit: 5, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;
  if (contentLengthTooLarge(request, 2048)) return Response.json({ error: "Request too large." }, { status: 413 });
  const base = process.env.APP_BASE_URL;
  if (!usesDatabase() || !base || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return Response.json({ error: "Email sign-in is not configured yet." }, { status: 503 });
  }
  let origin: string;
  try {
    const parsed = new URL(base);
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") throw new Error("HTTPS required");
    origin = parsed.origin;
  } catch { return Response.json({ error: "Email sign-in is not configured yet." }, { status: 503 }); }
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Forbidden." }, { status: 403 });
  let email: string | null;
  try { email = normalizeEmail((await readBoundedJson(request, 2048) as { email?: unknown })?.email); }
  catch (error) { return Response.json({ error: error instanceof RequestTooLargeError ? "Request too large." : "Invalid email." }, { status: error instanceof RequestTooLargeError ? 413 : 400 }); }
  if (!email) return Response.json({ error: "Invalid email." }, { status: 400 });
  try {
    const current = await accountSession();
    // A signed-in user cannot claim the same data under another email.
    if (current) return Response.json({ error: "Sign out before using a different email." }, { status: 409 });
    const proposedId = await getOrCreateUserId();
    const linkToken = await issueLoginLink(email, proposedId);
    if (!linkToken) return Response.json(generic);
    const link = new URL("/account/verify", origin);
    link.searchParams.set("token", linkToken);
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject: "Sign in to MyTruckPay", text: `Open this link to sign in to MyTruckPay. It expires in 15 minutes and works once:\n\n${link.href}\n\nIf you did not request it, ignore this email.` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!sent.ok) { await discardLoginLink(linkToken); return Response.json({ error: "Could not send email. Please try again." }, { status: 503 }); }
    return Response.json(generic, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Email sign-in is temporarily unavailable." }, { status: 503 });
  }
}
