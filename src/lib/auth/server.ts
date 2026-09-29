import { DocumentRepository } from "@/lib/persistence/documents";
import { deleteAllForUser } from "@/lib/payroll/store";
import { deleteProfile } from "@/lib/payroll/profile-store";
import { productionConfiguration } from "./production";
import { database } from "@/lib/persistence/database";
import "server-only";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createLocalAuth, localAuthEnabled } from "./config";
import { createEmailDelivery, emailConfiguration, type DeliveryStatus, type EmailMode } from "./email";

export const localAuthOrigin = process.env.NODE_ENV === "production" ? productionConfiguration().origin || "https://mytruckpay.com" : "http://127.0.0.1:43217";
type Auth = Awaited<ReturnType<typeof createLocalAuth>>;
type Runtime = { auth: Auth; db: DatabaseSync | null };
const state = globalThis as typeof globalThis & { truckpayEmailAuth?: Map<EmailMode, Promise<Runtime>> };

async function initialize(mode: EmailMode): Promise<Runtime> {
  if (!localAuthEnabled()) throw new Error("Local test authentication is disabled outside development.");
  if (process.env.NODE_ENV === "production") {
    const config = productionConfiguration();
    if (!config.ready || mode !== "resend") throw new Error("Production authentication is not configured.");
    const deliver = createEmailDelivery({ configuration: () => emailConfiguration(), environment: () => process.env.NODE_ENV, expectedMode: "resend", productionOrigin: config.origin,
      writeSimulation: async () => { throw Error("Simulation disabled in production"); }, claimTrial: async () => false, finishTrial: async () => {} });
    return { auth: await createLocalAuth({ database: database(), secret: process.env.BETTER_AUTH_SECRET!, baseURL: config.origin, cookiePrefix: "mtp_production", migrate: false, deleteAccountData: async id => { await new DocumentRepository(database()).wipe(id); }, deliver }), db: null };
  }
  const folder = path.join(process.cwd(), "data", "auth-local");
  await mkdir(path.join(folder, "mail"), { recursive: true });
  const real = mode === "resend";
  const secretPath = path.join(folder, real ? "email-secret" : "secret");
  try { await writeFile(secretPath, randomBytes(48).toString("base64url"), { flag: "wx", mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  // Real-email tests cannot inherit simulated verification, users, tokens or sessions.
  const db = new DatabaseSync(path.join(folder, real ? "accounts-email.sqlite" : "accounts.sqlite"));
  db.exec('CREATE TABLE IF NOT EXISTS local_mail_trial (id INTEGER PRIMARY KEY CHECK (id = 1), state TEXT NOT NULL, idempotency_key TEXT NOT NULL, provider_id TEXT)');
  const deliver = createEmailDelivery({
    configuration: () => emailConfiguration(),
    environment: () => process.env.NODE_ENV,
    expectedMode: mode,
    claimTrial: async key => Number(db.prepare('INSERT OR IGNORE INTO local_mail_trial (id, state, idempotency_key) VALUES (1, ?, ?)').run("reserved", key).changes) === 1,
    finishTrial: async (status, id) => { db.prepare('UPDATE local_mail_trial SET state = ?, provider_id = ? WHERE id = 1').run(status, id ?? null); },
    writeSimulation: async ({ email, url }) => {
      await writeFile(path.join(folder, "mail", `${Date.now()}-${randomUUID()}.json`), JSON.stringify({
        simulated: true, email, url, createdAt: new Date().toISOString(),
        note: "LOCAL TEST ONLY. No email was sent; opening this link simulates mailbox ownership.",
      }, null, 2), { mode: 0o600 });
    },
  });
  const auth = await createLocalAuth({
    database: db,
    deleteAccountData: async id => { await deleteAllForUser(id); await deleteProfile(id); },
    secret: await readFile(secretPath, "utf8"),
    baseURL: localAuthOrigin,
    cookiePrefix: real ? "mtp_real_email" : "mtp_account",
    deliver,
  });
  return { auth, db };
}

function runtime() {
  if (!localAuthEnabled()) throw new Error("Local test authentication is disabled outside development.");
  const mode = emailConfiguration().mode;
  if (mode === "invalid") throw new Error("Invalid local email mode.");
  const runtimes = state.truckpayEmailAuth ??= new Map();
  if (!runtimes.has(mode)) runtimes.set(mode, initialize(mode).catch(error => { runtimes.delete(mode); throw error; }));
  return runtimes.get(mode)!;
}

export async function getLocalAuth() { return (await runtime()).auth; }

export async function getDeliveryStatus(): Promise<DeliveryStatus> {
  const config = emailConfiguration();
  if (!localAuthEnabled() || config.mode === "invalid") return { mode: config.mode, ready: false, missing: config.missing, trialUsed: false };
  const trialUsed = process.env.NODE_ENV !== "production" && config.mode === "resend" && Boolean((await runtime()).db!.prepare('SELECT id FROM local_mail_trial WHERE id = 1').get());
  return { mode: config.mode, ready: config.ready && !trialUsed, missing: config.missing, trialUsed };
}
