import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { signAnonymousId, verifyAnonymousId } from "./anonymous-cookie";

test("anonymous ownership cookie rejects unsigned and altered user ids", () => {
  const owner = randomUUID();
  const other = randomUUID();
  const signed = signAnonymousId(owner);
  assert.equal(verifyAnonymousId(signed), owner);
  assert.equal(verifyAnonymousId(owner), null);
  assert.equal(verifyAnonymousId(signed.replace(owner, other)), null);
  assert.equal(verifyAnonymousId(signed.slice(0, -1) + (signed.endsWith("A") ? "B" : "A")), null);
});
