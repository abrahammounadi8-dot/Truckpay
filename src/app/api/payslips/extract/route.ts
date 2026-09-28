import { contentLengthTooLarge, rateLimit } from "@/lib/http/request-limits";
import { extractPayslipDocument } from "@/lib/payroll/extract-document";
import { publicError } from "@/lib/payroll/privacy";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_REQUEST_BYTES = 9 * 1024 * 1024;

export async function POST(request: Request) {
  const limited = rateLimit(request, { scope: "payslip-extract", limit: 20, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  if (contentLengthTooLarge(request, MAX_REQUEST_BYTES)) {
    return Response.json(publicError("That upload is too large. The file was not processed or stored."), { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(publicError("Send the payslip file."), { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json(publicError("Choose a payslip PDF or photo."), { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return Response.json(publicError("That file is too large (max 8 MB). The file was not stored."), { status: 413 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await extractPayslipDocument({
    bytes,
    mime: file.type,
    filename: file.name,
  });

  return Response.json({
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
