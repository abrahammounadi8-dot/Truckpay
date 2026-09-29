import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";

import { extractFromPayslipText, type ExtractedPayslipDraft } from "@/lib/payroll/extract-text";

import { extractSagePage } from "./extract-sage";


const MAX_BYTES = 8 * 1024 * 1024;
const PDF = "application/pdf";
const IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type DocumentExtractResult = {
  passwordStatus?: "required" | "incorrect";
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
  password?: string;
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
    let draft: ExtractedPayslipDraft;
    try {
      draft = await readPdfDraft(input.bytes, input.password);
    } catch (error) {
      if (error instanceof Error && error.name === "PasswordException") {
        return { kind: "pdf", stored: false, fileLabel, message: "PDF password needed.",
          passwordStatus: input.password ? "incorrect" : "required", draft: emptyDraft() };
      }
      return { kind: "unsupported", stored: false, fileLabel,
        message: "The PDF could not be opened. Check the file and try again.", draft: emptyDraft() };
    }
    return {
      kind: "pdf",
      stored: false,
      fileLabel,
      message: draftMessage("PDF", draft),
      draft,
    };
  }

  if (IMAGES.has(mime) || /\.(jpe?g|png|webp|gif)$/i.test(input.filename)) {
    const text = await readImageText(input.bytes);
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

async function readPdfDraft(bytes: Uint8Array, password?: string): Promise<ExtractedPayslipDraft> {
  const { extractText, extractTextItems, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes, { password });
  try {
    const { items } = await extractTextItems(pdf);
    const sage = items.map(extractSagePage).filter(draft => draft !== null);
    if (process.env.NODE_ENV === "development") {
      // Local diagnostic: only counts and known heading presence; never document text,
      // filenames, passwords, identities or payroll values.
      const headings = ["PAYMENTDETAILS", "DEDUCTIONDETAILS", "CUMULATIVEDETAILS", "THISPERIOD", "DESCRIPTION", "HOURS", "VALUE", "BALANCE", "NETPAY"];
      await writeFile(join(tmpdir(), "truckpay-extraction-status.json"), JSON.stringify({
        version: 1, checkedAt: new Date().toISOString(),
        pages: items.map(page => ({ items: page.length,
          headings: headings.filter(label => page.some(i => i.str.toUpperCase().replace(/[^A-Z0-9]/g, "") === label)) })),
        sagePages: sage.length, fieldCounts: sage.map(draft => draft.filledKeys.length),
      })).catch(() => undefined);
    }
    // Never combine distinct payslips from a multi-page file.
    if (sage.length) return items.length === 1 ? sage[0] : emptyDraft();
    const { text } = await extractText(pdf, { mergePages: true });
    return extractFromPayslipText(text);
  } finally {
    await pdf.loadingTask.destroy();
  }
}

async function readImageText(bytes: Uint8Array): Promise<string> {
  // Feed the image through a pipe: no original image is written to a temporary file.
  return new Promise(resolve => {
    try {
    const child = execFile("tesseract", ["stdin", "stdout", "-l", "eng", "--psm", "6"],
      { timeout: 25000, maxBuffer: 2_000_000, encoding: "utf8" },
      (error, stdout) => resolve(error ? "" : stdout));
    child.stdin?.on("error", () => { /* The process callback reports failure. */ });
    child.stdin?.end(bytes);
    } catch { resolve(""); }
  });
}
