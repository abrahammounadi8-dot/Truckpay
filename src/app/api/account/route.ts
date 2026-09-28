import { accountSession, revokeSession } from "@/lib/payroll/account";
import { rotateUserId } from "@/lib/payroll/session";

export const runtime = "nodejs";

export async function GET() {
  try { return Response.json({ account: await accountSession() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Account unavailable." }, { status: 503 }); }
}
export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Forbidden." }, { status: 403 });
  try { await revokeSession(); await rotateUserId(); return Response.json({ ok: true }); }
  catch { return Response.json({ error: "Could not sign out." }, { status: 503 }); }
}
