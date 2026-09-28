import { cookies } from "next/headers";
import { accountForUser, accountSession } from "./account";
import { signAnonymousId, verifyAnonymousId } from "./anonymous-cookie";

// Separate name preserves the legacy cookie for a controlled migration or rollback.
const COOKIE = "tp_uid_v2";

/**
 * Internal user id is a random UUID. Never a PPSN, licence, or employee number.
 */
export async function getOrCreateUserId(): Promise<string> {
  const session = await accountSession();
  if (session) return session.userId;
  const jar = await cookies();
  const existing = verifyAnonymousId(jar.get(COOKIE)?.value);
  if (existing && !(await accountForUser(existing))) return existing;
  const id = crypto.randomUUID();
  jar.set(COOKIE, signAnonymousId(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}

export async function readUserId(): Promise<string | null> {
  const session = await accountSession();
  if (session) return session.userId;
  const jar = await cookies();
  const existing = verifyAnonymousId(jar.get(COOKIE)?.value);
  return existing && !(await accountForUser(existing)) ? existing : null;
}

export async function rotateUserId(): Promise<string> {
  const jar = await cookies();
  const id = crypto.randomUUID();
  jar.set(COOKIE, signAnonymousId(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}
