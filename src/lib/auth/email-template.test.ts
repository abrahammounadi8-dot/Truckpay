import { it } from "node:test";
import assert from "node:assert/strict";
import { accessEmailTemplate } from "./email-template";

it("escapes link attributes and preserves the original plain-text link without remote assets", () => {
  const url = 'http://127.0.0.1:43217/api/auth/magic-link/verify?token=synthetic&callbackURL="<test>\'';
  const mail = accessEmailTemplate(url);
  assert.ok(mail.text.includes(url));
  assert.ok(mail.html.includes('&amp;callbackURL=&quot;&lt;test&gt;&#39;'));
  assert.ok(!mail.html.includes('callbackURL="<test>'));
  assert.deepEqual([...mail.html.matchAll(/src="([^"]+)"/g)].map(match => match[1]), ["cid:mtp-brand"]);
  assert.ok(!/<script|<form|https:\/\//i.test(mail.html));
  assert.match(mail.text, /10 minutos/);
  assert.match(mail.text, /only be used once/);
  assert.match(mail.text, /Do not share/);
});
