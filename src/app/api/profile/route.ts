import { parseProfileInput, refreshTenure, toStoredProfile } from "@/lib/payroll/profile";
import { getProfile, saveProfile } from "@/lib/payroll/profile-store";
import { getOrCreateUserId } from "@/lib/payroll/session";

export const runtime = "nodejs";

function stripUser<T extends { userId: string }>(value: T): Omit<T, "userId"> {
  const copy = { ...value };
  delete (copy as { userId?: string }).userId;
  return copy as Omit<T, "userId">;
}

export async function GET() {
  const userId = await getOrCreateUserId();
  const asOf = new Date().toISOString().slice(0, 10);
  const profile = await getProfile(userId);
  return Response.json({
    profile: profile ? stripUser(refreshTenure(profile, asOf)) : null,
  });
}

export async function PUT(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }
  const parsed = parseProfileInput(payload);
  if (parsed.error || !parsed.input) {
    return Response.json({ error: parsed.error ?? "Invalid profile." }, { status: 400 });
  }
  const userId = await getOrCreateUserId();
  const asOf = new Date().toISOString().slice(0, 10);
  try {
    const profile = await saveProfile(toStoredProfile(userId, parsed.input, asOf));
    return Response.json({ profile: stripUser(profile) });
  } catch {
    return Response.json({ error: "Could not save" }, { status: 503 });
  }
}
