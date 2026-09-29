/* eslint-disable @typescript-eslint/no-require-imports -- local operator tool */
// Separate from Next/Vercel. No writes, attestations, reservations or publication.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { randomBytes, timingSafeEqual } = require('node:crypto');
const root = path.resolve(__dirname, '..');

function installLoader() {
  const Module = require('node:module'), ts = require('typescript');
  const resolve = Module._resolveFilename;
  Module._resolveFilename = function (r, ...args) {
    return resolve.call(this, r.startsWith('@/') ? path.join(root, 'src', r.slice(2)) : r, ...args);
  };
  require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, f);
}

function safeReview(review) {
  // Explicit projection: never serialize audit (people, counts, fingerprint).
  return { status: review.status, publishable: false, blockers: review.blockers, proposal: review.proposal };
}

async function createReader(demo) {
  installLoader();
  const { preparePublicationReview } = require('../src/lib/payroll/publication-policy.ts');
  if (demo) {
    const { publicationFixture } = require('../src/lib/payroll/testing/publication-fixture.ts');
    return {
      catalogue: [{ slug: 'synthetic-firm', name: 'Empresa ficticia' }], close: async () => {},
      read: async request => {
        const input = publicationFixture(22);
        for (const profile of input.profiles.slice(11)) profile.employmentStarts['synthetic-firm'].startMonth = '2022-07';
        return safeReview(preparePublicationReview({ ...input, ...request }));
      },
    };
  }
  // Deliberately never use DATABASE_URL or load .env files.
  if (!process.env.MTP_OPERATOR_DATABASE_URL) throw Error('Configure MTP_OPERATOR_DATABASE_URL with a dedicated read-only database role.');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.MTP_OPERATOR_DATABASE_URL, max: 1,
    connectionTimeoutMillis: 5000, statement_timeout: 10000, idle_in_transaction_session_timeout: 15000 });
  const { fleet } = require('../src/lib/data.ts');
  const { loadPublicationSource } = require('../src/lib/payroll/publication-source.ts');
  const { historyInConnection } = require('../src/lib/payroll/publication-journal.ts');
  return { catalogue: fleet.map(c => ({ slug: c.slug, name: c.name ?? c.slug })), close: () => pool.end(),
    read: async request => {
      const connection = await pool.connect();
      try {
        await connection.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const source = await loadPublicationSource(connection, request);
        const review = preparePublicationReview({ ...source, history: await historyInConnection(connection) });
        await connection.query('COMMIT');
        return safeReview(review);
      } catch (error) {
        await connection.query('ROLLBACK').catch(() => {});
        throw error;
      } finally { connection.release(); }
    },
  };
}

async function startOperator({ reader, demo, lifetimeMs = 30 * 60 * 1000 }) {
  const token = randomBytes(32).toString('hex');
  let origin = '', busy = false, closed = false;
  const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/panel.js': ['panel.js', 'text/javascript; charset=utf-8'], '/panel.css': ['panel.css', 'text/css; charset=utf-8'] };
  const server = http.createServer(async (request, response) => {
    const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" };
    const send = (code, body) => { response.writeHead(code, { ...headers, 'Content-Type': 'application/json' }); response.end(JSON.stringify(body)); };
    // Fixed Host prevents DNS rebinding. Cross-origin requests cannot use even a stolen URL fragment.
    if (request.headers.host !== new URL(origin).host || (request.headers.origin && request.headers.origin !== origin)
      || request.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: 'Acceso local requerido.' });
    if (request.method !== 'GET') return send(405, { error: 'Solo lectura.' });
    let url;
    try { url = new URL(request.url, origin); } catch { return send(400, { error: 'Solicitud inválida.' }); }
    if (assets[url.pathname]) {
      const [file, type] = assets[url.pathname];
      response.writeHead(200, { ...headers, 'Content-Type': type });
      return response.end(fs.readFileSync(path.join(__dirname, 'operator-panel', file)));
    }
    const authorization = Buffer.from(request.headers.authorization ?? '');
    const expected = Buffer.from(`Bearer ${token}`);
    if (authorization.length !== expected.length || !timingSafeEqual(authorization, expected)) return send(401, { error: 'Sesión local no autorizada. Abre el enlace de la terminal.' });
    if (url.pathname === '/api/config') return send(200, { demo, publicationEnabled: false, catalogue: reader.catalogue });
    if (url.pathname !== '/api/review') return send(404, { error: 'No encontrado.' });
    const employerSlug = url.searchParams.get('company'), quarter = url.searchParams.get('quarter');
    if (!reader.catalogue.some(c => c.slug === employerSlug) || !/^20\d{2}-Q[1-4]$/.test(quarter ?? '')) return send(400, { error: 'Selecciona empresa y trimestre.' });
    const year = Number(quarter.slice(0, 4)), month = (Number(quarter.at(-1)) - 1) * 3;
    const period = { start: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10), end: new Date(Date.UTC(year, month + 3, 0)).toISOString().slice(0, 10) };
    if (period.end >= new Date().toISOString().slice(0, 10)) return send(400, { error: 'El trimestre debe estar cerrado.' });
    if (busy) return send(429, { error: 'Hay una revisión en curso.' });
    busy = true;
    try {
      const review = await reader.read({ employerSlug, period, frozenAt: new Date().toISOString() });
      send(200, { demo, ...review });
    } catch { send(503, { error: 'No se pudo preparar la revisión. Comprueba conexión, permisos y migraciones en la terminal.' }); }
    finally { busy = false; }
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 15000;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  let timer;
  const close = async () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
    await reader.close();
  };
  timer = setTimeout(() => { void close(); }, lifetimeMs);
  timer.unref();
  return { origin, token, url: `${origin}/#${token}`, close };
}

module.exports = { startOperator, safeReview, createReader };
if (require.main === module) (async () => {
  const mode = process.argv.slice(2);
  if (mode.length !== 1 || !['--demo', '--database'].includes(mode[0])) throw Error('Usage: node scripts/operator-review.cjs --demo | --database');
  const demo = mode[0] === '--demo';
  const app = await startOperator({ reader: await createReader(demo), demo });
  console.log(`${demo ? 'DEMO: datos ficticios' : 'REVISIÓN PRIVADA: solo lectura'}. Sesión local de 30 minutos.\n${app.url}`);
  process.once('SIGINT', () => { void app.close(); });
  process.once('SIGTERM', () => { void app.close(); });
})().catch(() => { console.error('No se inició el panel. Usa --demo o --database con MTP_OPERATOR_DATABASE_URL de solo lectura.'); process.exitCode = 1; });
