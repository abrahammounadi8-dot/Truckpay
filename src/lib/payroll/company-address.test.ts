import test from "node:test";
import assert from "node:assert/strict";
import { reviewedCompanyAddress, selectCompanyAddress, mapSearchUrl } from "../company-address";

const feature = (name = "Example Transport", extra = {}) => ({ properties: { name, osm_key: "office", osm_value: "logistics", osm_type: "N", osm_id: 42, street: "Main Street", housenumber: "10", city: "Dublin", country: "Ireland", ...extra }, geometry: { coordinates: [-6.2, 53.3] } });
test("unique exact public business match yields an address and fixed-origin map/source links", () => {
  const address = selectCompanyAddress("Example Transport Ltd", { features: [feature()] });
  assert.equal(address?.address, "10 Main Street, Dublin, Ireland");
  assert.equal(address?.sourceUrl, "https://www.openstreetmap.org/node/42");
  assert.equal(address?.mapUrl, mapSearchUrl("53.3,-6.2"));
});
test("fuzzy results, multiple branches, truncated results and missing streets stay unresolved", () => {
  for (const features of [[feature("Example Transit")], [feature(), feature()], Array(10).fill(feature()), [feature(undefined, { street: undefined })], [feature(undefined, { osm_value: "residential" })]]) {
    assert.equal(selectCompanyAddress("Example Transport", { features }), undefined);
  }
});
test("malformed and hostile provider data cannot create external links", () => {
  for (const result of [null, {}, { features: [null] }, { features: [feature(undefined, { osm_type: "javascript:alert(1)" })] }, { features: [{ ...feature(), geometry: { coordinates: [Infinity, 91] } }] }]) {
    assert.equal(selectCompanyAddress("Example Transport", result), undefined);
  }
});
test("reviewed public addresses cover current employers without matching unrelated names", () => {
  assert.match(reviewedCompanyAddress("Stateline Transport Ltd")!.address, /D09 P2NF/);
  assert.equal(reviewedCompanyAddress("Eirtrans")?.sourceUrl, "https://eirtrans.com/");
  assert.equal(reviewedCompanyAddress("Eirtrans UK"), undefined);
});
