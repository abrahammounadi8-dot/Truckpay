import { it } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { readFile, mkdtemp, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DocumentRepository } from "../persistence/documents";
import { createLocalAuth, localAuthEnabled, verifiedAccountId, validPrivateOrigin } from "./config";

const origin = "http://127.0.0.1:43217";
async function fixture(db = new DatabaseSync(":memory:"), secret = randomBytes(48).toString("hex"), deleteAccountData?: (id: string) => Promise<void>) {
  const mail: { email: string; url: string }[] = [];
  const auth = await createLocalAuth({ database: db, baseURL: origin, secret, deleteAccountData, deliver: async message => { mail.push(message); } });
  const call = (route: string, body?: object, cookie = "", requestOrigin = origin) => auth.handler(new Request(origin + "/api/auth/" + route, {
    method: body ? "POST" : "GET", headers: { origin: requestOrigin, "content-type": "application/json", cookie }, body: body ? JSON.stringify(body) : undefined,
  }));
  const requestLink = async (email = "alice@example.test") => {
    assert.equal((await call("sign-in/magic-link", { email, callbackURL: "/account", errorCallbackURL: "/account?error=link" })).status, 200);
    return mail.at(-1)!.url;
  };
  const consume = (url: string) => auth.handler(new Request(url));
  const cookies = (response: Response) => response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  const session = async (cookie: string) => (await call("get-session", undefined, cookie)).json();
  return { db, auth, mail, call, requestLink, consume, cookies, session };
}

it("requires consuming the delivered link before creating a verified account and private session", async () => {
  const f = await fixture();
  const url = await f.requestLink();
  assert.equal(await f.session(""), null);
  assert.equal((f.db.prepare('SELECT count(*) AS n FROM "user"').get() as { n: number }).n, 0);
  const stored = f.db.prepare('SELECT identifier FROM verification').get() as { identifier: string };
  assert.notEqual(stored.identifier, new URL(url).searchParams.get("token"));
  const response = await f.consume(url);
  assert.ok(response.headers.getSetCookie().some(value => value.includes("HttpOnly") && value.includes("SameSite=Lax")));
  const session = await f.session(f.cookies(response));
  assert.equal(session.user.emailVerified, true);
  assert.equal(session.user.email, "alice@example.test");
  assert.equal(verifiedAccountId(session), session.user.id);
});

it("consumes tokens only once, including concurrent attempts", async () => {
  const f = await fixture();
  const url = await f.requestLink();
  const responses = await Promise.all([f.consume(url), f.consume(url)]);
  assert.equal(responses.filter(response => response.headers.getSetCookie().length > 0).length, 1);
  assert.equal((await f.consume(url)).headers.getSetCookie().length, 0);
});

it("rejects expired links and expired sessions", async () => {
  const f = await fixture();
  const expired = await f.requestLink();
  f.db.exec('UPDATE verification SET "expiresAt" = 0');
  assert.equal((await f.consume(expired)).headers.getSetCookie().length, 0);
  const valid = await f.consume(await f.requestLink());
  const cookie = f.cookies(valid);
  assert.ok(await f.session(cookie));
  f.db.exec('UPDATE session SET "expiresAt" = 0');
  assert.equal(await f.session(cookie), null);
});

it("signs out and recovers the same account using a fresh link", async () => {
  const f = await fixture();
  const cookie = f.cookies(await f.consume(await f.requestLink()));
  const before = await f.session(cookie);
  assert.equal((await f.call("sign-out", {}, cookie)).status, 200);
  assert.equal(await f.session(cookie), null);
  const restoredCookie = f.cookies(await f.consume(await f.requestLink()));
  assert.equal((await f.session(restoredCookie)).user.id, before.user.id);
  assert.notEqual(restoredCookie, cookie);
});

it("preserves account identity and sessions when the SQLite database is reopened", async () => {
  const folder = await mkdtemp(path.join(tmpdir(), "truckpay-auth-test-"));
  const file = path.join(folder, "test.sqlite");
  const secret = randomBytes(48).toString("hex");
  let db = new DatabaseSync(file);
  try {
    const before = await fixture(db, secret);
    const cookie = before.cookies(await before.consume(await before.requestLink()));
    const id = (await before.session(cookie)).user.id;
    db.close();
    db = new DatabaseSync(file);
    const after = await fixture(db, secret);
    assert.equal((await after.session(cookie)).user.id, id);
    const recovered = after.cookies(await after.consume(await after.requestLink()));
    assert.equal((await after.session(recovered)).user.id, id);
  } finally {
    db.close();
    await unlink(file);
    await rmdir(folder);
  }
});

it("separates two accounts and ignores anonymous or tampered cookies", async () => {
  const f = await fixture();
  const alice = await f.session(f.cookies(await f.consume(await f.requestLink())));
  const bobCookie = f.cookies(await f.consume(await f.requestLink("bob@example.test")));
  const bob = await f.session(bobCookie);
  assert.notEqual(alice.user.id, bob.user.id);
  assert.equal(await f.session(`tp_uid=${alice.user.id}`), null);
  assert.equal(await f.session(bobCookie.replace("=", "=invalid")), null);
  assert.equal(verifiedAccountId({ ...bob, user: { ...bob.user, emailVerified: false } }), null);
});

it("rejects untrusted origins and callbacks, and rate limits link requests", async () => {
  const f = await fixture();
  assert.equal((await f.call("sign-in/magic-link", { email: "alice@example.test" }, "", "https://attacker.invalid")).status, 403);
  assert.equal((await f.call("sign-in/magic-link", { email: "alice@example.test", callbackURL: "https://attacker.invalid" })).status, 403);
  let last!: Response;
  for (let i = 0; i < 7; i++) last = await f.call("sign-in/magic-link", { email: "alice@example.test" });
  assert.equal(last.status, 429);
});

it("disables test authentication outside development and protects private mutations", () => {
  assert.equal(localAuthEnabled("production"), false);
  assert.equal(localAuthEnabled("test"), false);
  assert.equal(localAuthEnabled("development"), true);
  assert.equal(validPrivateOrigin(new Request(origin, { method: "DELETE" }), origin), false);
  assert.equal(validPrivateOrigin(new Request(origin, { method: "POST", headers: { origin: "https://attacker.invalid" } }), origin), false);
  assert.equal(validPrivateOrigin(new Request(origin, { method: "DELETE", headers: { origin } }), origin), true);
});

it("isolates payslips and profiles for two authenticated identities in the real document repository", async () => {
  const f = await fixture();
  const alice = (await f.session(f.cookies(await f.consume(await f.requestLink())))).user.id;
  const bob = (await f.session(f.cookies(await f.consume(await f.requestLink("bob@example.test"))))).user.id;
  const db = new PGlite();
  try {
    await db.exec(await readFile("src/lib/persistence/migrations/001-documents.sql", "utf8"));
    const repo = new DocumentRepository({ query: async (sql, params) => {
      const result = await db.query<Record<string, unknown>>(sql, params);
      return { rows: result.rows, rowCount: result.affectedRows ?? null };
    } });
    await repo.save("payslip", alice, "alice-slip", { userId: alice, netPay: 700 }, "same-hash");
    await repo.save("payslip", bob, "bob-slip", { userId: bob, netPay: 900 }, "same-hash");
    await repo.save("profile", alice, alice, { userId: alice, employerName: "A" });
    await repo.save("profile", bob, bob, { userId: bob, employerName: "B" });
    assert.equal((await repo.list("payslip", alice)).length, 1);
    assert.equal(await repo.get("payslip", bob, "alice-slip"), null);
    assert.equal(await repo.get("profile", bob, alice), null);
    assert.equal(await repo.remove("payslip", bob, "alice-slip"), 0);
    await assert.rejects(repo.save("payslip", bob, "alice-slip", { userId: bob }, "other-hash"), /ownership/);
    assert.equal(await repo.wipe(bob), 1);
    assert.ok(await repo.get("payslip", alice, "alice-slip"));
    assert.ok(await repo.get("profile", alice, alice));
  } finally { await db.close(); }
});

it("account deletion cleans payroll first and invalidates identity and all sessions",async()=>{
 let removed="";const f=await fixture(undefined,undefined,async id=>{removed=id});const cookie=f.cookies(await f.consume(await f.requestLink()));const user=(await f.session(cookie)).user.id;
 const result=await f.call("delete-user",{},cookie);assert.equal(result.status,200);assert.equal(removed,user);assert.equal(await f.session(cookie),null);assert.equal((f.db.prepare('SELECT count(*) AS n FROM "user"').get() as {n:number}).n,0);
});
it("account deletion is not acknowledged when payroll cleanup fails",async()=>{
 const f=await fixture(undefined,undefined,async()=>{throw Error("cleanup failed")});const cookie=f.cookies(await f.consume(await f.requestLink()));
 assert.ok((await f.call("delete-user",{},cookie)).status>=400);assert.ok((await f.session(cookie)).user);
});
