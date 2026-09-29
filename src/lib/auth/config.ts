import { betterAuth, type BetterAuthOptions } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { magicLink } from "better-auth/plugins";
import { productionConfiguration } from "./production";
import type { Pool } from "pg";
import type { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { APIError } from "better-auth/api";

export async function createLocalAuth(options: {
  database: DatabaseSync | Pool;
  migrate?: boolean;
  deleteAccountData?: (userId: string) => Promise<void>;
  secret: string;
  baseURL: string;
  deliver: (message: { email: string; url: string }) => Promise<void>;
  expiresIn?: number;
  cookiePrefix?: string;
}) {
  const config = {
    appName: "MyTruckPay",
    baseURL: options.baseURL,
    secret: options.secret,
    database: options.database,
    trustedOrigins: [options.baseURL],
    telemetry: { enabled: false },
    user: { deleteUser: { enabled: Boolean(options.deleteAccountData), beforeDelete: async user => { if (!options.deleteAccountData) throw new Error("Deletion unavailable"); try { await options.deleteAccountData(user.id); } catch { throw new APIError("SERVICE_UNAVAILABLE", {message:"Account data could not be deleted. Please retry."}); } } } },
    advanced: { database: { generateId: "uuid" }, cookiePrefix: options.cookiePrefix ?? "mtp_account" },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    plugins: [magicLink({
      expiresIn: options.expiresIn ?? 600,
      // Standard SHA-256/base64url, matching Better Auth's default hash. The documented
      // custom-hasher hook lets failed delivery revoke precisely this token as well.
      storeToken: { type: "custom-hasher", hash: async token => createHash("sha256").update(token).digest("base64url") },
      rateLimit: { window: 60, max: 5 },
      sendMagicLink: async (message, context) => {
        if (!context) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Missing delivery context." });
        try { await options.deliver(message); }
        catch {
          await context.context.internalAdapter.deleteVerificationByIdentifier(createHash("sha256").update(message.token).digest("base64url"));
          throw new APIError("BAD_GATEWAY", { code: "EMAIL_DELIVERY_FAILED", message: "Email delivery could not be confirmed. No automatic retry was made." });
        }
      },
    })],
  } satisfies BetterAuthOptions;
  if (options.migrate !== false) await (await getMigrations(config)).runMigrations();
  return betterAuth(config);
}

/** Anonymous cookies and caller-supplied IDs never establish account ownership. */
export function verifiedAccountId(session: { user: { id: string; emailVerified: boolean }; session: { expiresAt: Date } } | null): string | null {
  return session?.user.emailVerified && new Date(session.session.expiresAt).getTime() > Date.now() ? session.user.id : null;
}

export function localAuthEnabled(environment = process.env.NODE_ENV) {
  return environment === "development" || (environment === "production" && productionConfiguration().ready);
}

export function validPrivateOrigin(request: Request, origin: string) {
  return ["GET", "HEAD"].includes(request.method) || request.headers.get("origin") === origin;
}
