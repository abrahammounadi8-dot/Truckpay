import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { extractFromPayslipText, type ExtractedPayslipDraft } from "@/lib/payroll/extract-text";

const execFileAsync = promisify(execFile);
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
      message: draftMessage("PDF", draft),
      draft,
    };
  }

  if (IMAGES.has(mime) || /\.(jpe?g|png|webp|gif)$/i.test(input.filename)) {
    const text = await readImageText(input.bytes, input.filename);
    const draft = extractFromPayslipText(text);
    return {
      kind: "image",
      stored: false,
      fileLabel,
      message:
        text.length === 0 && draft.filledKeys.length === 0
          ? "Photo attached. No labelled figures could be read — type what is printed. The photo was not stored."
          : draftMessage("photo", draft),
      draft,
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

function draftMessage(kind: "PDF" | "photo", draft: ExtractedPayslipDraft): string {
  if (draft.filledKeys.length > 0) {
    return `Read ${draft.filledKeys.length} labelled field(s) from the ${kind}. Check them — MyTruckPay does not guess missing figures. The file was discarded.`;
  }
  return `The ${kind} was read but no labelled pay figures were found. Type the printed figures below. The file was discarded.`;
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

async function readImageText(bytes: Uint8Array, filename: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "truckpay-ocr-"));
  const ext = imageExt(filename);
  const file = join(dir, `slip.${ext}`);
  try {
    await writeFile(file, bytes);
    const { stdout } = await execFileAsync(
      "tesseract",
      [file, "stdout", "-l", "eng", "--psm", "6"],
      { timeout: 25000, maxBuffer: 2_000_000 },
    );
    return stdout ?? "";
  } catch {
    return "";
  } finally {
    await unlink(file).catch(() => undefined);
    await rmdir(dir).catch(() => undefined);
  }
}

function imageExt(filename: string): string {
  const match = filename.toLowerCase().match(/\.(jpe?g|png|webp|gif)$/);
  if (!match) return "png";
  if (match[1] === "jpeg") return "jpg";
  return match[1]!;
}
