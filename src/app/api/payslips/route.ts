import { DuplicatePayslipError } from "@/lib/persistence/documents";
import { parsePayslipInput, toStoredPayslip } from "@/lib/payroll/parse";
import { findDuplicate, hashFromInput } from "@/lib/payroll/fingerprint";
import { publicError } from "@/lib/payroll/privacy";
import { getOrCreateUserId } from "@/lib/payroll/session";
import { listPayslipsForUser, savePayslip } from "@/lib/payroll/store";
import { toPublicPayslip } from "@/lib/payroll/format";
import { REQUIRED_PAYSLIPS } from "@/lib/payroll/types";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getOrCreateUserId();
  const payslips = await listPayslipsForUser(userId);
  return Response.json({
    payslips: payslips.map(toPublicPayslip),
    required: REQUIRED_PAYSLIPS,
    have: Math.min(payslips.length, REQUIRED_PAYSLIPS),
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
  try {
    payslip = await savePayslip(toStoredPayslip(userId, parsed.input));
  } catch (error) {
    if (error instanceof DuplicatePayslipError) return Response.json(publicError("That payslip has already been saved."), { status: 409 });
    return Response.json(publicError("Could not save"), { status: 503 });
  }
  const have = existing.length + 1;
  return Response.json(
    {
      payslip: toPublicPayslip(payslip),
      have,
      required: REQUIRED_PAYSLIPS,
      readyForAnalysis: have >= REQUIRED_PAYSLIPS,
    },
    { status: 201 },
  );
}
