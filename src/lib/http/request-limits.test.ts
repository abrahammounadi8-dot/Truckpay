import assert from "node:assert/strict";
import test from "node:test";
import { contentLengthTooLarge } from "./request-limits";

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
