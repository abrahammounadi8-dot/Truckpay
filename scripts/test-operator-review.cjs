/* eslint-disable @typescript-eslint/no-require-imports -- standalone HTTP security tests */
const assert = require('node:assert/strict');
const http = require('node:http');
const { startOperator, safeReview, createReader } = require('./operator-review.cjs');
(async () => {
  let reads = 0, closes = 0;
  const demoReader = await createReader(true);
  const reader = { ...demoReader, read: async request => { reads++; return demoReader.read(request); }, close: async () => { closes++; } };
  const app = await startOperator({ reader, demo: true });
  const headers = { Authorization: `Bearer ${app.token}` };
  const query = '/api/review?company=synthetic-firm&quarter=2025-Q1';
  const request = (route, options) => fetch(app.origin + route, options);
  try {
    assert.equal((await request('/api/config')).status, 401);
    assert.equal((await request('/api/config', { headers: { Authorization: 'Bearer wrong' } })).status, 401);
    assert.equal((await request(query, { headers: { ...headers, Origin: 'https://attacker.invalid' } })).status, 403);
    assert.equal((await request(query, { headers: { ...headers, 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    const rebound = await new Promise((resolve, reject) => {
      http.get(app.origin + query, { headers: { ...headers, Host: 'attacker.invalid' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(rebound, 403);
    for (const method of ['POST', 'PUT', 'DELETE']) assert.equal((await request(query, { method, headers })).status, 405);
    for (const suffix of ['company=unknown&quarter=2025-Q1', 'company=synthetic-firm&quarter=2099-Q1', 'company=synthetic-firm&quarter=bad']) {
      assert.equal((await request('/api/review?' + suffix, { headers })).status, 400);
    }
    assert.equal(reads, 0, 'unauthorized and invalid requests never reach the source');
    const response = await request(query, { headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    const result = await response.json();
    assert.equal(result.publishable, false);
    assert.equal(result.demo, true);
    assert.equal(result.proposal.cells.length, 2);
    assert.equal(result.audit, undefined);
    assert.doesNotMatch(JSON.stringify(result), /personKeys|fingerprint|synthetic-0|543\.21/);
    assert.equal(safeReview({ status: 'blocked', blockers: [], proposal: null, audit: { secret: 'hidden' } }).audit, undefined);
    const html = await (await request('/')).text();
    assert.ok(html.includes('Revisión privada'));
    assert.ok(!html.includes(app.token), 'static shell does not disclose the local access token');
    assert.equal((await request('/api/attest', { headers })).status, 404);
    assert.equal((await request('/api/publish', { headers })).status, 404);
  } finally { await app.close(); }
  assert.equal(closes, 1);
  const expiring = await startOperator({ reader, demo: true, lifetimeMs: 20 });
  await new Promise(resolve => setTimeout(resolve, 100));
  await assert.rejects(fetch(expiring.origin + '/api/config', { headers: { Authorization: `Bearer ${expiring.token}` } }));
  await expiring.close();
  assert.equal(closes, 2);
  const old = process.env.MTP_OPERATOR_DATABASE_URL;
  delete process.env.MTP_OPERATOR_DATABASE_URL;
  try { await assert.rejects(createReader(false), /dedicated read-only/); }
  finally { if (old !== undefined) process.env.MTP_OPERATOR_DATABASE_URL = old; }
  console.log('PASS: local token, origin, DNS rebinding, read-only methods, no private audit, synthetic bands, expiry and no database fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
