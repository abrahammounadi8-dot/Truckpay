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
  const removed = await deleteAllForUser(userId);
  await deleteProfile(userId);
  await rotateUserId();
  return Response.json({ ok: true, deletedPayslips: removed });
}
