import assert from "node:assert/strict";
import test from "node:test";
import { contentLengthTooLarge, readBoundedJson, RequestTooLargeError } from "./request-limits";

test("contentLengthTooLarge rejects requests over the configured limit", () => {
  const request = new Request("https://example.test", {
    headers: { "content-length": "101" },
  });
  assert.equal(contentLengthTooLarge(request, 100), true);
});

test("contentLengthTooLarge accepts missing and smaller lengths", () => {
  assert.equal(contentLengthTooLarge(new Request("https://example.test"), 100), false);
  const request = new Request("https://example.test", {
    headers: { "content-length": "100" },
  });
  assert.equal(contentLengthTooLarge(request, 100), false);
});

test("readBoundedJson enforces actual bytes when length is absent or understated", async () => {
  const body = JSON.stringify({ email: "driver@example.com", padding: "x".repeat(200) });
  for (const headers of [new Headers(), new Headers({ "content-length": "2" })]) {
    const request = new Request("https://example.test", { method: "POST", headers, body });
    await assert.rejects(readBoundedJson(request, 64), RequestTooLargeError);
  }
  const valid = new Request("https://example.test", { method: "POST", body: '{"token":"ok"}' });
  assert.deepEqual(await readBoundedJson(valid, 64), { token: "ok" });
});
