import { database, usesDatabase } from "@/lib/persistence/database";
import { DocumentRepository } from "@/lib/persistence/documents";
import { deleteProfile } from "@/lib/payroll/profile-store";
import { getOrCreateUserId, rotateUserId } from "@/lib/payroll/session";
import { accountSession, revokeSession } from "@/lib/payroll/account";
import { deleteAllForUser } from "@/lib/payroll/store";

export const runtime = "nodejs";

export async function GET() {
  await getOrCreateUserId();
  return Response.json({
    userIdPresent: true,
    identity: "random-uuid",
    note: "This id is not a PPSN, licence number, or employee number.",
  });
}

export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Forbidden." }, { status: 403 });
  const userId = await getOrCreateUserId();
  let removed: number;
  try {
    if (usesDatabase()) {
      const client = await database().connect();
      try {
        await client.query("BEGIN");
        removed = await new DocumentRepository(client).wipe(userId);
        if ((await accountSession())?.userId === userId) {
          await client.query("DELETE FROM truckpay_accounts WHERE user_id = $1", [userId]);
        }
        await client.query("COMMIT");
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    } else {
      removed = await deleteAllForUser(userId);
      await deleteProfile(userId);
    }
  } catch {
    return Response.json({ error: "Could not delete your data. Please try again." }, { status: 503 });
  }
  await revokeSession();
  await rotateUserId();
  return Response.json({ ok: true, deletedPayslips: removed });
}
