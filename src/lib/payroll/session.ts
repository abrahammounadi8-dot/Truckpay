import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocalAuth, localAuthOrigin } from "@/lib/auth/server";
import { localAuthEnabled, verifiedAccountId, validPrivateOrigin } from "@/lib/auth/config";
import { emailConfiguration } from "@/lib/auth/email";
import { database } from "@/lib/persistence/database";
import { recordActivity } from "@/lib/retention/service";

export async function readUserId(): Promise<string | null> {
  if (!localAuthEnabled() || emailConfiguration().mode === "invalid") return null;
  const id = verifiedAccountId(await (await getLocalAuth()).api.getSession({ headers: await headers() }));
  if (id && process.env.NODE_ENV === "production" && process.env.MTP_RETENTION_ENABLED === "enabled") {
    if (!await recordActivity(database(), id)) return null;
  }
  return id;
}

export async function privateApiIdentity(request: Request): Promise<string | Response> {
  if (!validPrivateOrigin(request, localAuthOrigin)) return privateJson({ error: "Invalid request origin." }, { status: 403 });
  const id = await readUserId();
  return id ?? privateJson({ error: "Sign in to access your private data.", code: "AUTH_REQUIRED" }, { status: 401 });
}

export function privateJson(body: unknown, init: ResponseInit = {}) {
  const responseHeaders = new Headers(init.headers);
  responseHeaders.set("Cache-Control", "private, no-store");
  responseHeaders.append("Vary", "Cookie");
  return Response.json(body, { ...init, headers: responseHeaders });
}

export async function requireAccount() {
  const id = await readUserId();
  if (!id) redirect("/account");
  return id;
}
