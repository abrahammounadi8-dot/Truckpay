import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { updateProfile } from "@/lib/payroll/profile-store";
import { toStoredProfile } from "@/lib/payroll/profile";
import { STATISTICS_NOTICE_VERSION, sharesStatistics } from "@/lib/payroll/statistics-sharing";

export const runtime = "nodejs";
export async function PUT(request: Request) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  let body: { enabled?: unknown; noticeVersion?: unknown } | null;
  try { body = await request.json(); }
  catch { return privateJson({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body.enabled !== "boolean" || (body.enabled && body.noticeVersion !== STATISTICS_NOTICE_VERSION)) {
    return privateJson({ error: "Read the current statistics notice before choosing." }, { status: 400 });
  }
  const enabled = body.enabled;
  try {
    const now = new Date().toISOString();
    const profile = await updateProfile(userId, current => ({
      ...(current ?? toStoredProfile(userId, {}, now.slice(0, 10))),
      statisticsSharing: { enabled, noticeVersion: STATISTICS_NOTICE_VERSION, updatedAt: now },
    }));
    return privateJson({ enabled: sharesStatistics(profile) });
  } catch { return privateJson({ error: "Your choice could not be saved. Please retry." }, { status: 503 }); }
}
