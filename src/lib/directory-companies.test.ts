import { it } from "node:test";
import assert from "node:assert/strict";
import { addRegisteredEmployers } from "./directory-companies";
import { fleet } from "./data";
it("adds only employer identity, deduplicating case, accents in Unicode and punctuation", () => {
 const employers = [{employerName:"Synthetic Transport Ltd",employerSlug:"synthetic-transport-ltd", netPay:123, userId:"private-id"}, {employerName:"  SYNTHETIC TRANSPORT LTD.  "}];
 const result=addRegisteredEmployers([],employers);
 assert.equal(result.length,1); assert.equal(result[0].slug,"synthetic-transport-ltd");
 assert.equal(result[0].summary,"");assert.equal(result[0].driverReported,true);
 assert.ok(!JSON.stringify(result).includes("private-id"));assert.ok(!("netPay" in result[0]));
});
it("preserves curated names and prevents empty, malformed and slug-collision entries", () => {
 const c=fleet[0];const result=addRegisteredEmployers([c],[{employerName:c.shortName},{employerName:""},{employerName:"test@example.test"},{employerName:"<script>"}]);
 assert.deepEqual(result,[c]);
});
