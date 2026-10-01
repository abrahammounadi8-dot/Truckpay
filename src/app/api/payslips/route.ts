import { contentLengthTooLarge, rateLimit } from "@/lib/http/request-limits";
import { employmentStartFor, validateEmploymentStart } from "@/lib/payroll/employment-month";
import { checkAmountReceipt } from "@/lib/payroll/amount-review";
import { attachProcessing } from "@/lib/payroll/process";
import { DuplicatePayslipError } from "@/lib/persistence/documents";
import { parsePayslipInput, toStoredPayslip } from "@/lib/payroll/parse";
import { findDuplicate, hashFromInput } from "@/lib/payroll/fingerprint";
import { publicError } from "@/lib/payroll/privacy";
import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { listPayslipsForUser, savePayslip } from "@/lib/payroll/store";
import { toPublicPayslip } from "@/lib/payroll/format";
import { comparisonAccess } from "@/lib/payroll/access-state";
import { getProfile } from "@/lib/payroll/profile-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const [payslips, profile] = await Promise.all([listPayslipsForUser(userId), getProfile(userId)]);
  const access = comparisonAccess(payslips, profile);
  return privateJson({
    payslips: payslips.map(toPublicPayslip),
    profileEmployers: Array.from(new Map([
      ...Object.entries(profile?.employmentStarts ?? {}).map(([slug, entry]) => [slug, { slug, name: entry.employerName || slug }] as const),
      ...(profile?.employerSlug ? [[profile.employerSlug, { slug: profile.employerSlug, name: profile.employerName || profile.employerSlug }] as const] : []),
    ]).values()),
    required: access.required,
    have: access.have,
    readyForAnalysis: access.unlocked,
  });
}

export async function POST(request: Request) {
  const userId = await privateApiIdentity(request);
  if (userId instanceof Response) return userId;
  const limited = rateLimit(request, { scope: "payslip-create", limit: 30, windowMs: 60000 });
  if (limited) return limited;
  if (contentLengthTooLarge(request, 102400)) {
    return privateJson({ error: "Request is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return privateJson(publicError("Send JSON."), { status: 400 });
  }

  const parsed = parsePayslipInput(payload);
  if (parsed.error || !parsed.input) {
    return privateJson(publicError(parsed.error ?? "Invalid payslip."), { status: 400 });
  }

  const amountCheck = checkAmountReceipt(userId, (payload as Record<string, unknown>).amountReceipt, parsed.input);
  if (amountCheck.error) return privateJson({ error: amountCheck.error }, { status: 403 });

  let existing: Awaited<ReturnType<typeof listPayslipsForUser>>;
  try {
    existing = await listPayslipsForUser(userId);
  } catch {
    return privateJson(publicError("Could not save"), { status: 503 });
  }
  const employmentProfile = await getProfile(userId);
  const start = employmentStartFor(employmentProfile, parsed.input.employerSlug);
  if (!start || !parsed.input.employerSlug) return privateJson({ error: "Indica y guarda el mes y año en que empezaste en esta empresa.", code: "EMPLOYMENT_START_REQUIRED" }, { status: 422 });
  const startError = validateEmploymentStart(start.startMonth, parsed.input.employerSlug, existing, parsed.input.payPeriodEnd || parsed.input.paymentDate);
  if (startError) return privateJson({ error: startError }, { status: 422 });
  const duplicate = findDuplicate(existing, hashFromInput(parsed.input));
  if (duplicate) {
    return privateJson(
      {
        ...publicError("That payslip looks like one you already entered (same dates and totals)."),
        duplicateOf: duplicate.id,
      },
      { status: 409 },
    );
  }

  let payslip;
  let profile;
  try {
    profile = await getProfile(userId);
    const record = toStoredPayslip(userId, parsed.input);
    if (amountCheck.audit) record.manualAmountAudit = amountCheck.audit;
    payslip = await savePayslip(attachProcessing(record));
  } catch (error) {
    if (error instanceof DuplicatePayslipError) return privateJson(publicError("That payslip has already been saved."), { status: 409 });
    return privateJson(publicError("Could not save"), { status: 503 });
  }
  const access = comparisonAccess([payslip, ...existing], profile);
  return privateJson(
    {
      payslip: toPublicPayslip(payslip),
      have: access.have,
      required: access.required,
      readyForAnalysis: access.unlocked,
    },
    { status: 201 },
  );
}
