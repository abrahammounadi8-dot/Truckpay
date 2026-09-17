import { readFile } from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before running the migration.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(847291)");
  await client.query(await readFile(new URL("../src/lib/persistence/migrations/001-documents.sql", import.meta.url), "utf8"));
  await client.query("COMMIT");
  console.log("Truckpay database migration complete.");
} catch {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Database migration failed. Check connectivity, permissions, and migration compatibility.");
  process.exitCode = 1;
} finally { await client.end(); }
