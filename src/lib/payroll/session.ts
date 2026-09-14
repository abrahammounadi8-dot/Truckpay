import { cookies } from "next/headers";

const COOKIE = "tp_uid";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Internal user id is a random UUID. Never a PPSN, licence, or employee number.
 */
export async function getOrCreateUserId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && UUID.test(existing)) return existing;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}

export async function readUserId(): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  return existing && UUID.test(existing) ? existing : null;
}

export async function rotateUserId(): Promise<string> {
  const jar = await cookies();
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}
