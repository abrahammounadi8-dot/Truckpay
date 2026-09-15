import { extractPayslipDocument } from "@/lib/payroll/extract-document";
import { publicError } from "@/lib/payroll/privacy";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
