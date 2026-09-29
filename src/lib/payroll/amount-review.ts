import { randomUUID, randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import type { PayslipInput } from "./types";

export const amountKeys = ["basicRate", "basicPay", "overtimeRate", "overtimePay", "grossPay", "netPay", "holidayPay", "cumulativeGross", "cumulativeTax", "cumulativePrsi", "cumulativeUsc", "cumulativePension"] as const;
export type AmountSnapshot = Record<string, number | null | number[]>;
export type ManualAmountAudit = { original: AmountSnapshot; submitted: AmountSnapshot; changedFields: string[]; editedAt: string; source: "local_owner_test" };
export function canEditTestAmounts(userId: string, env: Record<string, string | undefined> = process.env, now = Date.now()) {
  const expires = Date.parse(env.MTP_AMOUNT_TEST_UNTIL ?? "");
  return env.NODE_ENV === "development" && env.MTP_AUTH_EMAIL_MODE === "resend"
    && !!env.MTP_AMOUNT_TEST_USER_ID && userId === env.MTP_AMOUNT_TEST_USER_ID
    && Number.isFinite(expires) && expires > now;
}
export function amountSnapshot(fields: Record<string, unknown>, deductions: { amount: number }[] = [], allowances: { amount: number }[] = []): AmountSnapshot {
  const result: AmountSnapshot = {};
  for (const key of amountKeys) {
    const value = fields[key];
    result[key] = value == null || value === "" ? null : Number(value);
  }
  result.deductions = deductions.map(s => s.amount);
  result.allowances = allowances.map(s => s.amount);
  return result;
}
type Receipt = { userId: string; expires: number; original: AmountSnapshot };
const state = globalThis as typeof globalThis & { mtpAmountReceipts?: Map<string, Receipt> };
const receipts = state.mtpAmountReceipts ??= new Map<string, Receipt>();
// Memory only: no PDF, password, personal fields or raw extraction text retained.
export function issueAmountReceipt(userId: string, original: AmountSnapshot, now = Date.now(), env: Record<string, string | undefined> = process.env) {
  if (env.NODE_ENV === "production") return sealReceipt({ userId, original: structuredClone(original), expires: now + 30 * 60_000 }, env);
  for (const [id, receipt] of receipts) if (receipt.expires <= now) receipts.delete(id);
  while (receipts.size >= 500) receipts.delete(receipts.keys().next().value!);
  const id = randomUUID(); receipts.set(id, { userId, original: structuredClone(original), expires: now + 30 * 60_000 }); return id;
}
export function checkAmountReceipt(userId: string, receiptId: unknown, input: PayslipInput, env: Record<string, string | undefined> = process.env, now = Date.now()): { error?: string; audit?: ManualAmountAudit } {
  const receipt = typeof receiptId === "string" ? (env.NODE_ENV === "production" ? openReceipt(receiptId, env) : receipts.get(receiptId)) : undefined;
  if (!receipt || receipt.userId !== userId || receipt.expires <= now) return { error: "Vuelve a leer el documento antes de guardar. La lectura ha caducado o no pertenece a esta cuenta." };
  const submitted = amountSnapshot(input as unknown as Record<string, unknown>, input.deductions, input.allowances);
  const changedFields = Object.keys(receipt.original).filter(k => JSON.stringify(receipt.original[k]) !== JSON.stringify(submitted[k]));
  if (!changedFields.length) return {};
  if (!canEditTestAmounts(userId, env, now)) return { error: "Los importes deben coincidir con la lectura del documento. Vuelve a cargar la nómina." };
  return { audit: { original: structuredClone(receipt.original), submitted, changedFields, editedAt: new Date(now).toISOString(), source: "local_owner_test" } };
}

// Authenticated encryption keeps payroll amounts out of readable client tokens.
// A shared deployment secret permits extraction and save on different instances.
function receiptKey(env: Record<string, string | undefined>) {
 const secret = env.MTP_RECEIPT_SECRET;
 if (!secret || secret.length < 32) throw new Error("MTP_RECEIPT_SECRET must contain at least 32 characters.");
 return createHash("sha256").update("truckpay-amount-receipt-v1:").update(secret).digest();
}
function sealReceipt(receipt: Receipt, env: Record<string, string | undefined>) {
 const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", receiptKey(env), iv);
 cipher.setAAD(Buffer.from("truckpay-amount-receipt-v1"));
 const encrypted = Buffer.concat([cipher.update(JSON.stringify(receipt), "utf8"), cipher.final()]);
 return ["v1", iv.toString("base64url"), encrypted.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}
function openReceipt(token: string, env: Record<string, string | undefined>): Receipt | undefined {
 try {
  if (token.length > 65536) return;
  const [version, iv, data, tag, extra] = token.split(".");
  if (version !== "v1" || !iv || !data || !tag || extra !== undefined) return;
  const decipher = createDecipheriv("aes-256-gcm", receiptKey(env), Buffer.from(iv,"base64url"));
  decipher.setAAD(Buffer.from("truckpay-amount-receipt-v1")); decipher.setAuthTag(Buffer.from(tag,"base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8")) as Receipt;
 } catch { return; }
}
