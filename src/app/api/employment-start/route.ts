import { payrollCountry } from "@/lib/payroll/country";
import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { getProfile, updateProfile } from "@/lib/payroll/profile-store";
import { toStoredProfile } from "@/lib/payroll/profile";
import { resolveEmployer } from "@/lib/payroll/employer";
import { employmentStartFor, monthlyTenure, validateEmploymentStart } from "@/lib/payroll/employment-month";
import { listPayslipsForUser } from "@/lib/payroll/store";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await privateApiIdentity(request); if (userId instanceof Response) return userId;
  const url = new URL(request.url);
  const requestedCountry = url.searchParams.get("countryCode");
  const countryCode = requestedCountry === "GB" || requestedCountry === "NL" || requestedCountry === "IE" ? requestedCountry : payrollCountry(request);
  const employer = resolveEmployer(url.searchParams.get("employer"), countryCode);
  const profile = await getProfile(userId);
  const entry = employmentStartFor(profile, employer.employerSlug);
  const asOf = url.searchParams.get("asOf") || new Date().toISOString().slice(0, 10);
  const error = entry && employer.employerSlug ? validateEmploymentStart(entry.startMonth, employer.employerSlug, await listPayslipsForUser(userId), asOf) : null;
  return privateJson({ startMonth: entry?.startMonth ?? null, source: entry ? "user_declared" : null, valid: !!entry && !error, error, tenure: entry && !error ? monthlyTenure(entry.startMonth, asOf) : null });
}
export async function PUT(request: Request) {
  const userId = await privateApiIdentity(request); if (userId instanceof Response) return userId;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return privateJson({ error: "Indica la empresa y el mes de inicio." }, { status: 400 }); }
  const countryCode = body.countryCode ?? payrollCountry(request);
  if (countryCode !== "IE" && countryCode !== "GB" && countryCode !== "NL") return privateJson({ error: "Unsupported payroll country." }, { status: 400 });
  const employer = resolveEmployer(typeof body?.employerName === "string" ? body.employerName : "", countryCode);
  if (!employer.employerSlug || !employer.employerName) return privateJson({ error: "Indica la empresa." }, { status: 400 });
  const asOf = typeof body.asOf === "string" && body.asOf ? body.asOf : undefined;
  const slips = await listPayslipsForUser(userId);
  const error = validateEmploymentStart(body.startMonth, employer.employerSlug, slips, asOf);
  if (error) return privateJson({ error }, { status: 400 });
  try {
    await updateProfile(userId, current => {
      const base = current ?? toStoredProfile(userId, { countryCode, ...employer }, new Date().toISOString().slice(0, 10));
      return { ...base, employmentStarts: { ...base.employmentStarts, [employer.employerSlug!]: {
        employerName: employer.employerName!, startMonth: body.startMonth as string, source: "user_declared", updatedAt: new Date().toISOString(),
      } } };
    });
    return privateJson({ ok: true, startMonth: body.startMonth, source: "user_declared", tenure: monthlyTenure(body.startMonth as string, asOf || new Date().toISOString().slice(0, 10)) });
  } catch { return privateJson({ error: "No se pudo guardar el mes de inicio." }, { status: 503 }); }
}
