import { it } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { createEmailDelivery, emailConfiguration, type EmailMode } from "./email";
import { createLocalAuth } from "./config";

const url = "http://127.0.0.1:43217/api/auth/magic-link/verify?token=synthetic-token&callbackURL=%2Faccount";
const message = { email: "driver@example.test", url };
const configured = { MTP_AUTH_EMAIL_MODE: "resend", RESEND_API_KEY: "re_test_key_never_used", MTP_AUTH_EMAIL_FROM: "access@example.test", MTP_AUTH_REAL_EMAIL_TEST: "enabled" };
function harness(transport: typeof fetch, env = configured, environment = "development") {
  const written: typeof message[] = [];
  const outcomes: string[] = [];
  let claimed = false;
  const deliver = createEmailDelivery({
    configuration: () => emailConfiguration(env), environment: () => environment,
    expectedMode: env.MTP_AUTH_EMAIL_MODE as EmailMode,
    writeSimulation: async value => { written.push(value); },
    claimTrial: async () => { if (claimed) return false; claimed = true; return true; },
    finishTrial: async state => { outcomes.push(state); }, transport,
  });
  return { deliver, written, outcomes };
}

it("requires explicit valid provider configuration and keeps simulation explicit", async () => {
  assert.equal(emailConfiguration({}).mode, "simulated");
  assert.deepEqual(emailConfiguration({ MTP_AUTH_EMAIL_MODE: "resend" }).missing, ["RESEND_API_KEY", "MTP_AUTH_EMAIL_FROM", "MTP_AUTH_REAL_EMAIL_TEST"]);
  assert.equal(emailConfiguration({ MTP_AUTH_EMAIL_MODE: "resned" }).ready, false);
  assert.equal(emailConfiguration({ ...configured, MTP_AUTH_EMAIL_FROM: "bad\r\nBcc: victim@example.test" }).ready, false);
  let calls = 0;
  const simulated = harness(async () => { calls++; throw new Error(); }, { ...configured, MTP_AUTH_EMAIL_MODE: "simulated" });
  await simulated.deliver(message);
  assert.equal(simulated.written.length, 1);
  assert.equal(calls, 0);
  const missing = harness(async () => { calls++; throw new Error(); }, { ...configured, RESEND_API_KEY: "" });
  await assert.rejects(missing.deliver(message), /EMAIL_NOT_CONFIGURED/);
  assert.equal(calls, 0);
  assert.equal(missing.written.length, 0);
});

it("sends one recipient through the documented API with idempotency and no secret in the message", async () => {
  let calls = 0;
  const h = harness(async (target, init) => {
    calls++;
    assert.equal(target, "https://api.resend.com/emails");
    assert.equal(init?.method, "POST");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("authorization"), "Bearer " + configured.RESEND_API_KEY);
    assert.match(headers.get("idempotency-key")!, /^mtp-local-access-/);
    const body = JSON.parse(init!.body as string);
    assert.deepEqual(body.to, [message.email]);
    assert.equal(body.from, `MyTruckPay <${configured.MTP_AUTH_EMAIL_FROM}>`);
    assert.ok(body.html.includes('src="cid:mtp-brand"'));
    assert.equal(body.attachments[0].content_id, "mtp-brand");
    assert.equal(body.attachments[0].content_type, "image/png");
    assert.equal(Buffer.from(body.attachments[0].content, "base64").subarray(1, 4).toString(), "PNG");
    assert.ok(!JSON.stringify(body).includes(configured.RESEND_API_KEY));
    assert.ok(!body.html.includes(message.email));
    assert.ok(body.text.includes(url));
    assert.ok(!body.text.includes(configured.RESEND_API_KEY));
    return Response.json({ id: "provider-test-id" });
  });
  const attempts = await Promise.allSettled([h.deliver(message), h.deliver(message)]);
  assert.equal(attempts.filter(a => a.status === "fulfilled").length, 1);
  assert.equal(calls, 1);
  assert.deepEqual(h.outcomes, ["accepted"]);
  assert.equal(h.written.length, 0);
});

it("fails closed on provider rejection, timeout, invalid responses and server errors without fallback or retry", async () => {
  for (const transport of [
    async () => Response.json({ message: "sensitive provider details" }, { status: 403 }),
    async () => Response.json({ message: "rate limit" }, { status: 429 }),
    async () => Response.json({}, { status: 500 }),
    async () => Response.json({}),
    async () => { throw new DOMException("Timed out", "TimeoutError"); },
  ]) {
    let calls = 0;
    const h = harness(async () => { calls++; return transport(); });
    await assert.rejects(h.deliver(message), /EMAIL_SEND_FAILED/);
    await assert.rejects(h.deliver(message), /EMAIL_TRIAL_USED/);
    assert.equal(calls, 1);
    assert.equal(h.written.length, 0);
    assert.ok(["failed", "unknown"].includes(h.outcomes[0]));
  }
});

it("never delivers outside development or to links outside the local application", async () => {
  let calls = 0;
  const transport: typeof fetch = async () => { calls++; return Response.json({ id: "unused" }); };
  await assert.rejects(harness(transport, configured, "production").deliver(message), /EMAIL_NOT_CONFIGURED/);
  await assert.rejects(harness(transport).deliver({ ...message, url: "https://attacker.invalid/?token=x" }), /EMAIL_SEND_FAILED/);
  assert.equal(calls, 0);
});

it("revokes a generated token if delivery fails and never creates a verified account", async () => {
  const db = new DatabaseSync(":memory:");
  let failedUrl = "";
  const auth = await createLocalAuth({ database: db, baseURL: "http://127.0.0.1:43217", secret: randomBytes(48).toString("hex"), deliver: async message => { failedUrl = message.url; throw new Error("provider denied"); } });
  const response = await auth.handler(new Request("http://127.0.0.1:43217/api/auth/sign-in/magic-link", { method: "POST", headers: { origin: "http://127.0.0.1:43217", "content-type": "application/json" }, body: JSON.stringify({ email: message.email, callbackURL: "/account" }) }));
  assert.equal(response.status, 502);
  assert.equal((db.prepare('SELECT count(*) AS n FROM verification').get() as { n: number }).n, 0);
  assert.equal((db.prepare('SELECT count(*) AS n FROM "user"').get() as { n: number }).n, 0);
  assert.equal((await auth.handler(new Request(failedUrl))).headers.getSetCookie().length, 0);
});

it("an accepted test transport completes the actual link flow only after redemption", async () => {
  const db = new DatabaseSync(":memory:");
  let delivered = "";
  const h = harness(async (_target, init) => {
    delivered = (JSON.parse(init!.body as string).text as string).match(/http:\/\/127[^\s]+/)![0];
    return Response.json({ id: "transport-only-not-a-real-email" });
  });
  const auth = await createLocalAuth({ database: db, baseURL: "http://127.0.0.1:43217", secret: randomBytes(48).toString("hex"), deliver: h.deliver, cookiePrefix: "mtp_real_email_test" });
  const request = await auth.handler(new Request("http://127.0.0.1:43217/api/auth/sign-in/magic-link", { method: "POST", headers: { origin: "http://127.0.0.1:43217", "content-type": "application/json" }, body: JSON.stringify({ email: message.email, callbackURL: "/account" }) }));
  assert.equal(request.status, 200);
  assert.equal((db.prepare('SELECT count(*) AS n FROM "user"').get() as { n: number }).n, 0);
  const redeemed = await auth.handler(new Request(delivered));
  assert.ok(redeemed.headers.getSetCookie().some(cookie => cookie.startsWith("mtp_real_email_test.")));
  assert.equal((await auth.handler(new Request(delivered))).headers.getSetCookie().length, 0);
});
