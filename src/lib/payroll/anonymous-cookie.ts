import { createHmac, timingSafeEqual } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function secret(): string {
  const value = process.env.ANONYMOUS_COOKIE_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") throw new Error("ANONYMOUS_COOKIE_SECRET must be at least 32 characters");
  return "local-development-only-anonymous-cookie-secret";
}

export function signAnonymousId(id: string): string {
  if (!UUID.test(id)) throw new Error("Invalid anonymous id");
  const signature = createHmac("sha256", secret()).update(`tp_uid:v1:${id}`).digest("base64url");
  return `v1.${id}.${signature}`;
}

export function verifyAnonymousId(value: string | undefined): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" || !UUID.test(parts[1]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[2])) return null;
  const expected = signAnonymousId(parts[1]).split(".")[2];
  return timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected)) ? parts[1] : null;
}
