import { contentLengthTooLarge, rateLimit } from "@/lib/http/request-limits";
import { employmentStartFor } from "@/lib/payroll/employment-month";
import { parseProfileInput, refreshTenure, toStoredProfile } from "@/lib/payroll/profile";
import { getProfile, updateProfile } from "@/lib/payroll/profile-store";
import { privateApiIdentity, privateJson } from "@/lib/payroll/session";

export const runtime = "nodejs";

function stripUser<T extends { userId: string }>(value: T): Omit<T, "userId"> {
  const copy = { ...value };
  delete (copy as { userId?: string }).userId;
  return copy as Omit<T, "userId">;
}

export async function GET(request: Request) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const asOf = new Date().toISOString().slice(0, 10);
  const profile = await getProfile(userId);
  return privateJson({
    profile: profile ? stripUser(refreshTenure(profile, asOf)) : null,
  });
}

export async function PUT(request: Request) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const limited = rateLimit(request, { scope: "profile-update", limit: 30, windowMs: 60000 });
  if (limited) return limited;
  if (contentLengthTooLarge(request, 65536)) {
    return privateJson({ error: "Request is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return privateJson({ error: "Send JSON." }, { status: 400 });
  }
  const parsed = parseProfileInput(payload);
  if (parsed.error || !parsed.input) {
    return privateJson({ error: parsed.error ?? "Invalid profile." }, { status: 400 });
  }
  const asOf = new Date().toISOString().slice(0, 10);
  if (parsed.input.employerSlug && !employmentStartFor(await getProfile(userId), parsed.input.employerSlug)) return privateJson({ error: "Guarda primero el mes y año de inicio en esta empresa." }, { status: 422 });
  try {
    const input = parsed.input;
    const profile = await updateProfile(userId, current => ({ ...toStoredProfile(userId, { ...input, tenureSource: "user_declared" }, asOf), employmentStarts: current?.employmentStarts, statisticsSharing: current?.statisticsSharing, publicationSharing: current?.publicationSharing }));
    return privateJson({ profile: stripUser(profile) });
  } catch {
    return privateJson({ error: "Could not save" }, { status: 503 });
  }
}
