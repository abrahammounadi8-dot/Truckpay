import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authorization, downloadPdf, exchange, gmailConfig, GMAIL_SCOPE, listPdfs, MAX_PDF_BYTES, seal, unseal, type GmailGrant } from "./client";

const config = { clientId: "TEST-client", clientSecret: "TEST-secret", secret: "TEST-only-secret-at-least-32-characters", redirectUri: "http://127.0.0.1:43217/api/gmail/callback" };
const grant: GmailGrant = { userId: "test-user", token: "TEST-access-token", email: "test@example.invalid", expires: Date.now() + 60_000 };
const pdf = Buffer.from("%PDF-1.4\nTEST DATA ONLY\n%%EOF");
const part = { partId: "1.0", filename: "TEST.pdf", mimeType: "application/pdf", body: { attachmentId: "test-attachment", size: pdf.length } };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function mock(handler: (url: string, init?: RequestInit) => Response): typeof fetch { return (async (url, init) => handler(String(url), init)) as typeof fetch; }

describe("Gmail authorization and private import", () => {
  it("stays unavailable until every credential is configured", () => {
    assert.equal(gmailConfig("http://localhost", {}), null);
    assert.equal(gmailConfig("http://localhost", { GMAIL_CLIENT_ID: "a", GMAIL_CLIENT_SECRET: "b", GMAIL_COOKIE_SECRET: "short" }), null);
  });
  it("encrypts grants and rejects another account, purpose, tampering or expiry", () => {
    const value = seal(grant, "grant", config.secret);
    assert.ok(!value.includes(grant.token));
    assert.deepEqual(unseal(value, "grant", config.secret, grant.userId), grant);
    assert.equal(unseal(value, "grant", config.secret, "another-user"), null);
    assert.equal(unseal(value, "state", config.secret, grant.userId), null);
    assert.equal(unseal("x" + value.slice(1), "grant", config.secret, grant.userId), null);
    assert.equal(unseal(seal({ ...grant, expires: 1 }, "grant", config.secret), "grant", config.secret, grant.userId), null);
  });
  it("uses read-only consent, state, PKCE and no offline refresh access", () => {
    const { state, url } = authorization(config, grant.userId);
    const params = new URL(url).searchParams;
    assert.equal(params.get("scope"), GMAIL_SCOPE);
    assert.equal(params.get("state"), state.nonce);
    assert.equal(params.get("code_challenge_method"), "S256");
    assert.equal(params.get("access_type"), "online");
    assert.ok(!url.includes(state.verifier));
  });
  it("exchanges codes only on the server and limits grant duration", async () => {
    const { state } = authorization(config, grant.userId);
    const result = await exchange(config, state, "TEST-code", mock((url, init) => {
      if (url.endsWith("/token")) {
        const body = init?.body as URLSearchParams;
        assert.equal(body.get("code_verifier"), state.verifier);
        return response({ access_token: grant.token, expires_in: 7200, scope: GMAIL_SCOPE });
      }
      assert.equal((init?.headers as Record<string, string>).Authorization, `Bearer ${grant.token}`);
      return response({ emailAddress: grant.email });
    }));
    assert.equal(result.email, grant.email);
    assert.ok(result.expires <= Date.now() + 3600_000);
  });
  it("refuses tokens that did not receive the read permission", async () => {
    const { state } = authorization(config, grant.userId);
    await assert.rejects(exchange(config, state, "TEST-code", mock(() => response({ access_token: "x", expires_in: 3600, scope: "openid" }))), /PROVIDER/);
  });
  it("lists nested PDFs, not message text or oversized files", async () => {
    const result = await listPdfs(grant.token, "TEST company", undefined, mock(url => {
      if (new URL(url).pathname.endsWith("/messages")) {
        assert.ok(new URL(url).searchParams.get("q")?.includes("filename:pdf"));
        return response({ messages: [{ id: "msg1" }], nextPageToken: "next" });
      }
      return response({ id: "msg1", internalDate: "1780000000000", payload: { body: { data: "PRIVATE-BODY" }, headers: [{ name: "Subject", value: "TEST payslip" }], parts: [{ parts: [part, { ...part, filename: "large.pdf", body: { size: MAX_PDF_BYTES + 1 } }, { filename: "other.txt", mimeType: "text/plain", body: { size: 1 } }] }] } });
    }));
    assert.equal(result.files.length, 1);
    assert.equal(result.files[0].filename, "TEST.pdf");
    assert.equal(result.nextPageToken, "next");
    assert.ok(!JSON.stringify(result).includes("PRIVATE-BODY"));
  });
  it("retrieves only a PDF part that belongs to the selected message", async () => {
    const bytes = await downloadPdf(grant.token, "msg1", "1.0", mock(url => url.includes("/attachments/") ? response({ data: pdf.toString("base64url"), size: pdf.length }) : response({ payload: { parts: [part] } })));
    assert.deepEqual(bytes, pdf);
    await assert.rejects(downloadPdf(grant.token, "msg1", "9", mock(() => response({ payload: { parts: [part] } }))), /INVALID_FILE/);
  });
  it("rejects oversized or non-PDF attachment bytes and path injection", async () => {
    await assert.rejects(downloadPdf(grant.token, "msg1", "1.0", mock(() => response({ payload: { parts: [{ ...part, body: { size: MAX_PDF_BYTES + 1 } }] } }))), /TOO_LARGE/);
    await assert.rejects(downloadPdf(grant.token, "msg1", "1.0", mock(url => url.includes("/attachments/") ? response({ data: Buffer.from("not a PDF").toString("base64url") }) : response({ payload: { parts: [part] } }))), /INVALID_FILE/);
    await assert.rejects(downloadPdf(grant.token, "../other", "1.0", mock(() => { throw new Error("must not fetch"); })), /BAD_REQUEST/);
  });
  it("reports expired provider access without returning provider error details", async () => {
    await assert.rejects(listPdfs(grant.token, "", undefined, mock(() => response({ error: "PRIVATE-PROVIDER-DETAIL" }, 401))), /RECONNECT/);
  });
});
