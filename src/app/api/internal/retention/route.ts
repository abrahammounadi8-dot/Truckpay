import { timingSafeEqual } from "node:crypto";
import { database } from "@/lib/persistence/database";
import { runRetention } from "@/lib/retention/service";
import { resendRetentionMail } from "@/lib/retention/email";
import { configuredDeletionLedger } from "@/lib/retention/external-ledger";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = Buffer.from(`Bearer ${secret ?? ""}`), actual = Buffer.from(request.headers.get("authorization") ?? "");
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return new Response(null, { status: 401 });
  const mode = process.env.MTP_RETENTION_MODE;
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (process.env.MTP_RETENTION_ENABLED !== "enabled") return json({ status: "disabled" });
  if (mode !== "dry-run" && mode !== "notify" && mode !== "delete") return json({ error: "Invalid retention mode." }, 503);
  if (mode === "delete" && process.env.MTP_RETENTION_RESTORE_READY !== "confirmed") return json({ error: "Restore procedure must be verified before deletion." }, 503);
  try {
    const mail = mode === "dry-run" ? { send: async () => { throw Error("Disabled"); }, delivered: async () => false } : resendRetentionMail();
    const result = await runRetention(database(), mail, mode, mode === "delete" ? configuredDeletionLedger() : undefined);
    return json(result, result.errors || result.blocked ? 503 : 200);
  } catch { return json({ error: "Retention run failed; inspect configuration and database availability." }, 503); }
}
