import { DuplicatePayslipError } from "@/lib/persistence/documents";
import { parsePayslipInput, toStoredPayslip } from "@/lib/payroll/parse";
import { findDuplicate, hashFromInput } from "@/lib/payroll/fingerprint";
import { publicError } from "@/lib/payroll/privacy";
import { getOrCreateUserId } from "@/lib/payroll/session";
import { listPayslipsForUser, savePayslip } from "@/lib/payroll/store";
import { toPublicPayslip } from "@/lib/payroll/format";
import { comparisonAccess } from "@/lib/payroll/access-state";
import { getProfile } from "@/lib/payroll/profile-store";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getOrCreateUserId();
  const [payslips, profile] = await Promise.all([listPayslipsForUser(userId), getProfile(userId)]);
  const access = comparisonAccess(payslips, profile);
  return Response.json({
    payslips: payslips.map(toPublicPayslip),
    required: access.required,
    have: access.have,
    readyForAnalysis: access.unlocked,
  });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(publicError("Send JSON."), { status: 400 });
  }

  const parsed = parsePayslipInput(payload);
  if (parsed.error || !parsed.input) {
    return Response.json(publicError(parsed.error ?? "Invalid payslip."), { status: 400 });
  }

  const userId = await getOrCreateUserId();
  let existing: Awaited<ReturnType<typeof listPayslipsForUser>>;
  try {
    existing = await listPayslipsForUser(userId);
  } catch {
    return Response.json(publicError("Could not save"), { status: 503 });
  }
  const duplicate = findDuplicate(existing, hashFromInput(parsed.input));
  if (duplicate) {
    return Response.json(
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
    payslip = await savePayslip(toStoredPayslip(userId, parsed.input));
  } catch (error) {
    if (error instanceof DuplicatePayslipError) return Response.json(publicError("That payslip has already been saved."), { status: 409 });
    return Response.json(publicError("Could not save"), { status: 503 });
  }
  const access = comparisonAccess([payslip, ...existing], profile);
  return Response.json(
    {
      payslip: toPublicPayslip(payslip),
      have: access.have,
      required: access.required,
      readyForAnalysis: access.unlocked,
    },
    { status: 201 },
  );
}
