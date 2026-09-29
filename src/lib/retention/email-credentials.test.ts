import { test } from "node:test";
import assert from "node:assert/strict";
import { resendRetentionMail } from "./email";

test("delivery lookup uses its separate credential while sending keeps restricted access", async () => {
  const calls: { method: string; key: string | null }[] = [];
  const transport: typeof fetch = async (_url, init) => {
    calls.push({ method: init?.method ?? "GET", key: new Headers(init?.headers).get("authorization") });
    return Response.json({ id: "test-message", last_event: "delivered" });
  };
  const env = { RESEND_API_KEY: "send-only", RESEND_RETENTION_API_KEY: "delivery-lookup", MTP_AUTH_EMAIL_FROM: "sender@example.test", MTP_AUTH_URL: "https://example.test" };
  const mail = resendRetentionMail(env, transport);
  assert.equal(await mail.send("recipient@example.test", "fixture"), "test-message");
  assert.equal(await mail.delivered("test-message"), true);
  assert.deepEqual(calls, [
    { method: "POST", key: "Bearer send-only" },
    { method: "GET", key: "Bearer delivery-lookup" },
  ]);
});
