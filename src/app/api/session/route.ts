import { database, usesDatabase } from "@/lib/persistence/database";
import { DocumentRepository } from "@/lib/persistence/documents";
import { deleteProfile } from "@/lib/payroll/profile-store";
import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { deleteAllForUser } from "@/lib/payroll/store";
import { emailConfiguration } from "@/lib/auth/email";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = await privateApiIdentity(request);
  if (identity instanceof Response) return identity;
  return privateJson({ authenticated: true, identity: "verified-account", simulatedEmail: emailConfiguration().mode === "simulated" }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: Request) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  let removed: number;
  try {
    if (usesDatabase()) {
      removed = await new DocumentRepository(database()).wipe(userId);
    } else {
      removed = await deleteAllForUser(userId);
      await deleteProfile(userId);
    }
  } catch {
    return privateJson({ error: "Could not delete your data. Please try again." }, { status: 503 });
  }
  return privateJson({ ok: true, deletedPayslips: removed });
}
