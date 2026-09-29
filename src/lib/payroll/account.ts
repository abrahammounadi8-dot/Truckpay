import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { database, usesDatabase } from "@/lib/persistence/database";
import { signAnonymousId } from "./anonymous-cookie";

const SESSION_COOKIE = "tp_session";
const LINK_TTL_MINUTES = 15;
const SESSION_TTL_DAYS = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const token = () => randomBytes(32).toString("base64url");
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function accountForUser(userId: string): Promise<boolean> {
  if (!usesDatabase()) return false;
  const result = await database().query("SELECT 1 FROM truckpay_accounts WHERE user_id = $1", [userId]);
  return Boolean(result.rowCount);
}

export async function accountSession(): Promise<{ userId: string; email: string } | null> {
  if (!usesDatabase()) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) return null;
  const result = await database().query(
    `SELECT a.user_id, a.email FROM truckpay_account_sessions s
     JOIN truckpay_accounts a ON a.user_id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`, [hash(raw)],
  );
  const row = result.rows[0];
  return row ? { userId: String(row.user_id), email: String(row.email) } : null;
}

export async function issueLoginLink(email: string, proposedUserId: string): Promise<string> {
  if (!usesDatabase() || !UUID.test(proposedUserId)) throw new Error("Account storage unavailable");
  const raw = token();
  const db = database();
  // Database backed throttle works across server instances. Do not leak whether an email is registered.
  const recent = await db.query(
    "SELECT 1 FROM truckpay_login_links WHERE email = $1 AND created_at > now() - interval '60 seconds' LIMIT 1", [email],
  );
  if (recent.rowCount) return "";
  await db.query(
    `INSERT INTO truckpay_login_links (token_hash, email, proposed_user_id, expires_at)
     VALUES ($1, $2, $3, now() + interval '15 minutes')`,
    [hash(raw), email, proposedUserId],
  );
  return raw;
}

export async function discardLoginLink(raw: string): Promise<void> {
  await database().query("DELETE FROM truckpay_login_links WHERE token_hash = $1", [hash(raw)]);
}

export async function redeemLoginLink(raw: string): Promise<boolean> {
  if (!usesDatabase() || !/^[A-Za-z0-9_-]{43}$/.test(raw)) return false;
  // Fail before consuming the one-time link if anonymous cookie signing is misconfigured.
  signAnonymousId(crypto.randomUUID());
  const client = await database().connect();
  let userId: string;
  try {
    await client.query("BEGIN");
    const found = await client.query(
      "DELETE FROM truckpay_login_links WHERE token_hash = $1 AND expires_at > now() RETURNING email, proposed_user_id", [hash(raw)],
    );
    if (!found.rowCount) { await client.query("ROLLBACK"); return false; }
    const { email, proposed_user_id: proposed } = found.rows[0];
    // An existing email always resolves to its own account; never attach this browser's anonymous data.
    const existing = await client.query("SELECT user_id FROM truckpay_accounts WHERE email = $1", [email]);
    if (existing.rowCount) userId = String(existing.rows[0].user_id);
    else {
      // A legacy anonymous id can only be claimed once. A second email gets a new id.
      const claim = await client.query(
        `INSERT INTO truckpay_accounts (user_id, email) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING user_id`, [proposed, email],
      );
      if (claim.rowCount) userId = String(claim.rows[0].user_id);
      else {
        const concurrent = await client.query("SELECT user_id FROM truckpay_accounts WHERE email = $1", [email]);
        if (concurrent.rowCount) userId = String(concurrent.rows[0].user_id);
        else {
          userId = crypto.randomUUID();
          await client.query("INSERT INTO truckpay_accounts (user_id, email) VALUES ($1, $2)", [userId, email]);
        }
      }
    }
    const sessionToken = token();
    await client.query(
      `INSERT INTO truckpay_account_sessions (token_hash, user_id, expires_at)
       VALUES ($1, $2, now() + interval '30 days')`, [hash(sessionToken), userId],
    );
    await client.query("COMMIT");
    const jar = await cookies();
    jar.set(SESSION_COOKIE, sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_DAYS * 86400 });
    jar.set("tp_uid_v2", signAnonymousId(userId), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 86400 });
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally { client.release(); }
}

export async function revokeSession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw && usesDatabase()) await database().query("DELETE FROM truckpay_account_sessions WHERE token_hash = $1", [hash(raw)]);
  jar.delete(SESSION_COOKIE);
}

export async function deleteAccount(userId: string): Promise<void> {
  if (usesDatabase()) await database().query("DELETE FROM truckpay_accounts WHERE user_id = $1", [userId]);
}

export const loginLinkExpiryMinutes = LINK_TTL_MINUTES;
