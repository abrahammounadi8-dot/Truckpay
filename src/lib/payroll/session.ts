import { cookies } from "next/headers";

const COOKIE = "tp_uid";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  };
}

/**
 * Internal user id is a random UUID. Never a PPSN, licence, or employee number.
 */
export async function getOrCreateUserId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && UUID.test(existing)) return existing;
  const id = crypto.randomUUID();
  jar.set(COOKIE, id, cookieOptions());
  return id;
}

export async function readUserId(): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  return existing && UUID.test(existing) ? existing : null;
}

export async function setUserId(id: string): Promise<void> {
  if (!UUID.test(id)) throw new Error("Invalid user id.");
  const jar = await cookies();
  jar.set(COOKIE, id, cookieOptions());
}

export async function rotateUserId(): Promise<string> {
  const id = crypto.randomUUID();
  await setUserId(id);
  return id;
}
