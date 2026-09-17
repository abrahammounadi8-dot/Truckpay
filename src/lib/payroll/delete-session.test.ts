import { it } from "node:test";
import assert from "node:assert/strict";
import { deleteSession } from "./delete-session";
it("only confirms deletion after a successful explicit acknowledgement", async () => {
  await deleteSession(async () => Response.json({ ok: true }));
  await assert.rejects(deleteSession(async () => Response.json({ error: "unavailable" }, { status: 503 })));
  await assert.rejects(deleteSession(async () => Response.json({ ok: false })));
  await assert.rejects(deleteSession(async () => { throw new Error("offline"); }));
});
