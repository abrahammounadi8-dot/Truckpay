import { redeemLoginLink } from "@/lib/payroll/account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 2048) return Response.json({ error: "Invalid link." }, { status: 400 });
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Forbidden." }, { status: 403 });
  let token: unknown;
  try { token = (await request.json()).token; } catch { return Response.json({ error: "Invalid link." }, { status: 400 }); }
  if (typeof token !== "string") return Response.json({ error: "Invalid link." }, { status: 400 });
  try {
    const ok = await redeemLoginLink(token);
    return Response.json(ok ? { ok: true } : { error: "Link expired or already used. Request another one." }, { status: ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Could not verify this link. Try again." }, { status: 503 }); }
}
