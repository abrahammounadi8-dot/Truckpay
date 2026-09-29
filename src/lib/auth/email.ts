import { randomUUID } from "node:crypto";
import { accessEmailTemplate } from "./email-template";

export type EmailMode = "simulated" | "resend" | "invalid";
export type DeliveryStatus = { mode: EmailMode; ready: boolean; missing: string[]; trialUsed: boolean };
type Environment = Record<string, string | undefined>;
export function emailConfiguration(env: Environment = process.env) {
  const value = env.MTP_AUTH_EMAIL_MODE ?? "simulated";
  const mode: EmailMode = value === "simulated" || value === "resend" ? value : "invalid";
  const missing: string[] = [];
  if (mode === "invalid") missing.push("MTP_AUTH_EMAIL_MODE");
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.MTP_AUTH_EMAIL_FROM?.trim() ?? "";
  if (mode === "resend") {
    if (!apiKey.startsWith("re_") || apiKey.length < 8) missing.push("RESEND_API_KEY");
    if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(from)) missing.push("MTP_AUTH_EMAIL_FROM");
    if (env.NODE_ENV !== "production" && env.MTP_AUTH_REAL_EMAIL_TEST !== "enabled") missing.push("MTP_AUTH_REAL_EMAIL_TEST");
  }
  return { mode, apiKey, from, ready: missing.length === 0, missing };
}

export class EmailDeliveryError extends Error {
  constructor(public code: "EMAIL_NOT_CONFIGURED" | "EMAIL_TRIAL_USED" | "EMAIL_SEND_FAILED") {
    super(code); this.name = "EmailDeliveryError";
  }
}

export function createEmailDelivery(options: {
  configuration: () => ReturnType<typeof emailConfiguration>;
  environment: () => string | undefined;
  expectedMode: EmailMode;
  writeSimulation: (message: { email: string; url: string }) => Promise<void>;
  claimTrial: (idempotencyKey: string) => Promise<boolean>;
  finishTrial: (state: "accepted" | "failed" | "unknown", providerId?: string) => Promise<void>;
  transport?: typeof fetch;
  productionOrigin?: string;
}) {
  return async (message: { email: string; url: string }) => {
    const config = options.configuration();
    const production = options.environment() === "production" && !!options.productionOrigin && new URL(options.productionOrigin).protocol === "https:" && config.mode === "resend";
    if ((!production && options.environment() !== "development") || !config.ready || config.mode !== options.expectedMode) throw new EmailDeliveryError("EMAIL_NOT_CONFIGURED");
    const link = new URL(message.url);
    if (link.origin !== (production ? options.productionOrigin : "http://127.0.0.1:43217") || link.pathname !== "/api/auth/magic-link/verify" || !link.searchParams.get("token")) throw new EmailDeliveryError("EMAIL_SEND_FAILED");
    if (config.mode === "simulated") return options.writeSimulation(message);
    if (config.mode !== "resend") throw new EmailDeliveryError("EMAIL_NOT_CONFIGURED");
    const idempotencyKey = `mtp-local-access-${randomUUID()}`;
    if (!production && !await options.claimTrial(idempotencyKey)) throw new EmailDeliveryError("EMAIL_TRIAL_USED");
    // Exactly one explicitly armed trial. No automatic retries, redirects or simulated fallback.
    let classified = false;
    try {
      const response = await (options.transport ?? fetch)("https://api.resend.com/emails", {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ from: `MyTruckPay <${config.from}>`, to: [message.email], ...accessEmailTemplate(message.url, production) }),
      });
      if (!response.ok) {
        await options.finishTrial(response.status < 500 ? "failed" : "unknown");
        classified = true;
        throw new EmailDeliveryError("EMAIL_SEND_FAILED");
      }
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string" || !result.id) throw new EmailDeliveryError("EMAIL_SEND_FAILED");
      // Provider acceptance is not proof of inbox delivery or of email ownership.
      await options.finishTrial("accepted", result.id);
    } catch {
      if (!classified) {
        try { await options.finishTrial("unknown"); } catch { /* A reserved trial still prevents another send. */ }
      }
      throw new EmailDeliveryError("EMAIL_SEND_FAILED");
    }
  };
}
