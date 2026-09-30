import { Pool } from "pg";
import { timingSafeEqual } from "node:crypto";
import { reviewPublicationIdentity, type IdentityReviewAction } from "../src/lib/payroll/publication-identities";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function sameSecret(a: string, b: string): boolean {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

const configuredSecret = process.env.MTP_IDENTITY_ADMIN_SECRET;
const operatorToken = process.env.MTP_IDENTITY_OPERATOR_TOKEN;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
if (!configuredSecret || !operatorToken || !sameSecret(configuredSecret, operatorToken)) {
  throw new Error("Operator authentication failed.");
}

const action = arg("action") as IdentityReviewAction | undefined;
const userId = arg("user");
const reviewerReference = arg("reviewer");
const personKey = arg("person-key");
const reason = arg("reason");
if (!action || !["approve","link","conflict","unverified","revoke"].includes(action)) throw new Error("Valid --action is required.");
if (!userId || !reviewerReference) throw new Error("--user and --reviewer are required.");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  const result = await reviewPublicationIdentity(pool, { userId, action, reviewerReference, personKey, reason });
  console.log(JSON.stringify(result));
} finally {
  await pool.end();
}
