import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { prepareImport, importRecords } from "../src/lib/persistence/import";

async function main() {
  const [slipsFile, profilesFile] = process.argv.slice(2);
  if (!slipsFile || !profilesFile || !process.env.DATABASE_URL) {
    throw new Error("Usage: DATABASE_URL configured; npm run db:import -- payslips.json profiles.json");
  }
  // Read only explicitly named inputs; never search for private files.
  const records = prepareImport(JSON.parse(await readFile(slipsFile, "utf8")), JSON.parse(await readFile(profilesFile, "utf8")));
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await db.connect();
    await db.query("BEGIN");
    await db.query("LOCK TABLE truckpay_documents IN SHARE ROW EXCLUSIVE MODE");
    const result = await importRecords(db, records);
    await db.query("COMMIT");
    console.log("Import complete: " + result.inserted + " inserted; " + result.unchanged + " unchanged.");
  } catch {
    await db.query("ROLLBACK").catch(() => {});
    throw new Error("Import failed; no partial import was committed. Check the input files and database configuration.");
  } finally { await db.end(); }
}
main().catch(() => { console.error("Import failed. Check the two input file paths, JSON structure, and DATABASE_URL. No partial import was committed."); process.exitCode = 1; });
