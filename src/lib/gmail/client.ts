import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
export const MAX_PDF_BYTES = 8 * 1024 * 1024;
export type GmailConfig = { clientId: string; clientSecret: string; secret: string; redirectUri: string };
export type GmailGrant = { userId: string; token: string; email: string; expires: number };
export type GmailState = { userId: string; nonce: string; verifier: string; expires: number; returnTo?: string };
export class GmailError extends Error {
  constructor(public code: "RECONNECT" | "PROVIDER" | "INVALID_FILE" | "TOO_LARGE" | "BAD_REQUEST") { super(code); }
}
export function gmailConfig(origin: string, env: Record<string, string | undefined> = process.env): GmailConfig | null {
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || (env.GMAIL_COOKIE_SECRET?.length ?? 0) < 32) return null;
  return { clientId: env.GMAIL_CLIENT_ID, clientSecret: env.GMAIL_CLIENT_SECRET, secret: env.GMAIL_COOKIE_SECRET!, redirectUri: `${origin}/api/gmail/callback` };
}
export function seal(value: GmailGrant | GmailState, purpose: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  cipher.setAAD(Buffer.from(purpose));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function unseal<T extends GmailGrant | GmailState>(value: string | undefined, purpose: string, secret: string, userId: string): T | null {
  if (!value || value.length > 3800) return null;
  try {
    const data = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), data.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose)); decipher.setAuthTag(data.subarray(12, 28));
    const result = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8")) as T;
    return result.userId === userId && Number.isFinite(result.expires) && result.expires > Date.now() ? result : null;
  } catch { return null; }
}
export function authorization(config: GmailConfig, userId: string) {
  const state: GmailState = { userId, nonce: randomBytes(32).toString("base64url"), verifier: randomBytes(32).toString("base64url"), expires: Date.now() + 10 * 60_000 };
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: "code", scope: GMAIL_SCOPE, access_type: "online", prompt: "select_account", state: state.nonce, code_challenge: createHash("sha256").update(state.verifier).digest("base64url"), code_challenge_method: "S256" }).toString();
  return { state, url: url.toString() };
}
async function json<T>(url: string, init: RequestInit, fetcher = fetch): Promise<T> {
  const res = await fetcher(url, { ...init, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new GmailError(res.status === 401 ? "RECONNECT" : "PROVIDER");
  return res.json() as Promise<T>;
}
export async function exchange(config: GmailConfig, state: GmailState, code: string, fetcher = fetch): Promise<GmailGrant> {
  const token = await json<{ access_token: string; expires_in: number; scope: string }>("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, code_verifier: state.verifier, redirect_uri: config.redirectUri, grant_type: "authorization_code" }),
  }, fetcher);
  if (!token.access_token || !token.scope?.split(" ").includes(GMAIL_SCOPE) || !(token.expires_in > 0)) throw new GmailError("PROVIDER");
  const profile = await api<{ emailAddress: string }>(token.access_token, "profile", fetcher);
  return { userId: state.userId, token: token.access_token, email: profile.emailAddress, expires: Date.now() + Math.min(token.expires_in, 3600) * 1000 };
}
function api<T>(token: string, path: string, fetcher = fetch) {
  return json<T>(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, { headers: { Authorization: `Bearer ${token}` } }, fetcher);
}
type Part = { partId?: string; filename?: string; mimeType?: string; body?: { attachmentId?: string; size?: number; data?: string }; parts?: Part[] };
type Message = { id: string; internalDate: string; payload?: Part & { headers?: { name: string; value: string }[] } };
export type MailPdf = { messageId: string; partId: string; filename: string; subject: string; receivedAt: string; size: number };
const id = (value: string) => { if (!/^[a-zA-Z0-9_.-]{1,1000}$/.test(value)) throw new GmailError("BAD_REQUEST"); return encodeURIComponent(value); };
function pdfParts(part: Part, result: Part[] = [], depth = 0): Part[] {
  if (depth > 15) return result;
  if (part.mimeType === "application/pdf" || part.filename?.toLowerCase().endsWith(".pdf")) result.push(part);
  for (const child of part.parts ?? []) pdfParts(child, result, depth + 1);
  return result;
}
// Limit MIME metadata traversal and omit all message-body data from search results.
function metadataFields(depth = 8): string {
  return `partId,filename,mimeType,body(size,attachmentId)${depth ? `,parts(${metadataFields(depth - 1)})` : ""}`;
}
export async function listPdfs(token: string, search: string, pageToken?: string, fetcher = fetch) {
  const term = search.trim().slice(0, 100).replace(/["\\\r\n]/g, " ");
  const query = `has:attachment filename:pdf ${term ? `"${term}"` : "{payslip payroll nómina}"}`;
  const params = new URLSearchParams({ q: query, maxResults: "10" });
  if (pageToken) { if (pageToken.length > 1000) throw new GmailError("BAD_REQUEST"); params.set("pageToken", pageToken); }
  const list = await api<{ messages?: { id: string }[]; nextPageToken?: string }>(token, `messages?${params}`, fetcher);
  const files: MailPdf[] = [];
  for (const entry of (list.messages ?? []).slice(0, 10)) {
    const message = await api<Message>(token, `messages/${id(entry.id)}?${new URLSearchParams({ format: "full", fields: `id,internalDate,payload(headers,${metadataFields()})` })}`, fetcher);
    const subject = message.payload?.headers?.find(h => h.name.toLowerCase() === "subject")?.value.slice(0, 160) ?? "";
    for (const part of pdfParts(message.payload ?? {})) {
      if (part.partId == null || !part.filename || !part.body?.size || part.body.size > MAX_PDF_BYTES) continue;
      files.push({ messageId: message.id, partId: part.partId, filename: part.filename.slice(0, 150), subject, receivedAt: new Date(Number(message.internalDate)).toISOString(), size: part.body.size });
    }
  }
  return { files, nextPageToken: list.nextPageToken ?? null };
}
export async function downloadPdf(token: string, messageId: string, partId: string, fetcher = fetch) {
  if (partId) id(partId);
  const message = await api<Message>(token, `messages/${id(messageId)}?format=full&fields=payload`, fetcher);
  const part = pdfParts(message.payload ?? {}).find(p => p.partId === partId);
  if (!part?.body) throw new GmailError("INVALID_FILE");
  if ((part.body.size ?? Infinity) > MAX_PDF_BYTES) throw new GmailError("TOO_LARGE");
  const attachment = part.body.attachmentId
    ? await api<{ data: string; size: number }>(token, `messages/${id(messageId)}/attachments/${id(part.body.attachmentId)}`, fetcher)
    : part.body;
  if (!attachment.data || attachment.data.length > Math.ceil(MAX_PDF_BYTES * 4 / 3) + 4) throw new GmailError("TOO_LARGE");
  const bytes = Buffer.from(attachment.data, "base64url");
  if (bytes.length > MAX_PDF_BYTES) throw new GmailError("TOO_LARGE");
  if (!bytes.subarray(0, 1024).includes(Buffer.from("%PDF-"))) throw new GmailError("INVALID_FILE");
  return bytes;
}
export async function revoke(token: string, fetcher = fetch) {
  const response = await fetcher("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }), signal: AbortSignal.timeout(15_000), redirect: "error" });
  if (!response.ok) throw new GmailError("PROVIDER");
}
