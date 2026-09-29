import { redeemLoginLink } from "@/lib/payroll/account";
import { contentLengthTooLarge, readBoundedJson, RequestTooLargeError } from "@/lib/http/request-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (contentLengthTooLarge(request, 2048)) return Response.json({ error: "Request too large." }, { status: 413 });
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Forbidden." }, { status: 403 });
  let token: unknown;
  try { token = (await readBoundedJson(request, 2048) as { token?: unknown })?.token; }
  catch (error) { return Response.json({ error: error instanceof RequestTooLargeError ? "Request too large." : "Invalid link." }, { status: error instanceof RequestTooLargeError ? 413 : 400 }); }
  if (typeof token !== "string") return Response.json({ error: "Invalid link." }, { status: 400 });
  try {
    const ok = await redeemLoginLink(token);
    return Response.json(ok ? { ok: true } : { error: "Link expired or already used. Request another one." }, { status: ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not verify this link. Try again." }, { status: 503 }); }
}
