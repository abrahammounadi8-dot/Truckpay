import { database, usesDatabase } from "@/lib/persistence/database";
import { DocumentRepository } from "@/lib/persistence/documents";
import { deleteProfile } from "@/lib/payroll/profile-store";
import { getOrCreateUserId, rotateUserId } from "@/lib/payroll/session";
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

export async function DELETE() {
  const userId = await getOrCreateUserId();
  let removed: number;
  try {
    if (usesDatabase()) {
      removed = await new DocumentRepository(database()).wipe(userId);
    } else {
      removed = await deleteAllForUser(userId);
      await deleteProfile(userId);
    }
  } catch {
    return Response.json({ error: "Could not delete your data. Please try again." }, { status: 503 });
  }
  await rotateUserId();
  return Response.json({ ok: true, deletedPayslips: removed });
}
