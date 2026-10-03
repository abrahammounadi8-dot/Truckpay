import { contentLengthTooLarge, rateLimit } from "@/lib/http/request-limits";
import { amountSnapshot, issueAmountReceipt, canEditTestAmounts } from "@/lib/payroll/amount-review";
import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { extractPayslipDocument } from "@/lib/payroll/extract-document";
import { publicError } from "@/lib/payroll/privacy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const identity = await privateApiIdentity(request);
  if (identity instanceof Response) return identity;
  const limited = rateLimit(request, { scope: "payslip-extract", limit: 20, windowMs: 600000 });
  if (limited) return limited;
  if (contentLengthTooLarge(request, 9437184)) {
    return privateJson({ error: "Request is too large." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return privateJson(publicError("Send the payslip file."), { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return privateJson(publicError("Choose a payslip PDF or photo."), { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return privateJson(publicError("That file is too large (max 8 MB). The file was not stored."), { status: 413 });
  }
  const countryCode = form.get("countryCode") ?? "IE";
  if (countryCode !== "IE" && countryCode !== "US") return privateJson({ error: "Unsupported payroll country." }, { status: 400 });
  const password = form.get("password");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await extractPayslipDocument({
    countryCode,
    bytes,
    mime: file.type,
    filename: file.name,
    password: typeof password === "string" ? password : undefined,
  });

  return privateJson({
    amountReceipt: !result.passwordStatus && result.kind !== "unsupported" ? issueAmountReceipt(identity, amountSnapshot(result.draft.fields, result.draft.deductions, result.draft.allowances)) : null,
    canEditAmounts: canEditTestAmounts(identity),
    passwordStatus: result.passwordStatus,
    kind: result.kind,
    stored: false,
    fileLabel: result.fileLabel,
    message: result.message,
    fields: result.draft.fields,
    deductions: result.draft.deductions,
    allowances: result.draft.allowances,
    filledKeys: result.draft.filledKeys,
  });
}
