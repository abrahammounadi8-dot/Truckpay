import { extractFromPayslipText, type ExtractedPayslipDraft } from "@/lib/payroll/extract-text";

const MAX_BYTES = 8 * 1024 * 1024;
const PDF = "application/pdf";
const IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type DocumentExtractResult = {
  kind: "pdf" | "image" | "unsupported";
  stored: false;
  fileLabel: string;
  message: string;
  draft: ExtractedPayslipDraft;
};

export async function extractPayslipDocument(input: {
  bytes: Uint8Array;
  mime: string;
  filename: string;
}): Promise<DocumentExtractResult> {
  const fileLabel = safeFileLabel(input.filename);
  if (input.bytes.byteLength > MAX_BYTES) {
    return {
      kind: "unsupported",
      stored: false,
      fileLabel,
      message: "That file is too large (max 8 MB). The file was not stored.",
      draft: emptyDraft(),
    };
  }

  const mime = input.mime || guessMime(input.filename);
  if (mime === PDF || input.filename.toLowerCase().endsWith(".pdf")) {
    const text = await readPdfText(input.bytes);
    const draft = extractFromPayslipText(text);
    return {
      kind: "pdf",
      stored: false,
      fileLabel,
      message:
        draft.filledKeys.length > 0
          ? `Read ${draft.filledKeys.length} labelled field(s) from the PDF. Check them — TruckPay does not guess missing figures. The file was discarded.`
          : "The PDF was read but no labelled pay figures were found. Type the printed figures below. The file was discarded.",
      draft,
    };
  }

  if (IMAGES.has(mime) || /\.(jpe?g|png|webp|gif)$/i.test(input.filename)) {
    return {
      kind: "image",
      stored: false,
      fileLabel,
      message:
        "Photo attached. TruckPay cannot read photos yet — type the printed figures below. The photo was not stored.",
      draft: emptyDraft(),
    };
  }

  return {
    kind: "unsupported",
    stored: false,
    fileLabel,
    message: "Use a PDF or a photo (JPG/PNG). The file was not stored.",
    draft: emptyDraft(),
  };
}

function emptyDraft(): ExtractedPayslipDraft {
  return { fields: {}, deductions: [], allowances: [], filledKeys: [] };
}

function safeFileLabel(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").slice(0, 80);
  if (!base) return "payslip";
  return base.replace(/\b\d{7}[A-Za-z]{1,2}\b/g, "redacted");
}

function guessMime(name: string): string {
  if (name.toLowerCase().endsWith(".pdf")) return PDF;
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  return "";
}

async function readPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const { extractText } = await import("unpdf");
    const { text } = await extractText(bytes, { mergePages: true });
    return text;
  } catch {
    return "";
  }
}
