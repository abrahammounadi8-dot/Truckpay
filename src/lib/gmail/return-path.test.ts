import { it } from "node:test";
import assert from "node:assert/strict";
import { gmailReturnLocation } from "./return-path";
it("returns to the three-slip flow and preserves selected employer",()=>{
 assert.equal(gmailReturnLocation("/report","connected"),"/report?gmail=connected");
 assert.equal(gmailReturnLocation("/report?company=synthetic-firm","connected"),"/report?company=synthetic-firm&gmail=connected");
 assert.equal(gmailReturnLocation("/payslips/new","connected"),"/payslips/new?gmail=connected");
});
it("old connections and unsafe return paths use the three-slip flow",()=>{
 for(const value of [undefined,"https://evil.invalid","//evil.invalid","/report?next=https://evil.invalid","/report#bad"])assert.equal(gmailReturnLocation(value,"error"),"/report?gmail=error");
});
