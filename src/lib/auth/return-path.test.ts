import test from "node:test";
import assert from "node:assert/strict";
import { accountReturnPath } from "./return-path";
test("sign in resumes allowed payslip and employer flows", () => {
  for (const path of ["/payslips", "/payslips/new", "/report", "/report?company=example-ltd"]) assert.equal(accountReturnPath(path), path);
});
test("external, protocol-relative and unrecognised redirects are rejected", () => {
  for (const path of [undefined, "https://example.com", "//example.com", "/payslips//example.com", "/payslips?next=https://example.com", "/account", "/report?company=a&next=https://example.com"]) assert.equal(accountReturnPath(path), "/");
});
