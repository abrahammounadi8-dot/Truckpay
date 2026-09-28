import { readFile } from "node:fs/promises";

// Read-only inventory of explicit exports. Never print record contents or user IDs.
export function summarizeLegacyPayroll(payslipsFile, profilesFile) {
  const payslips = Array.isArray(payslipsFile) ? payslipsFile : payslipsFile?.payslips;
  const profiles = Array.isArray(profilesFile) ? profilesFile : profilesFile?.profiles;
  if (!Array.isArray(payslips) || !Array.isArray(profiles)) throw new Error("Expected payslips and profiles arrays.");
  const owners = new Set();
  let invalid = 0;
  for (const record of [...payslips, ...profiles]) {
    if (!record || typeof record.userId !== "string" || !/^[0-9a-f-]{36}$/i.test(record.userId)) invalid++;
    else owners.add(record.userId);
  }
  return { payslips: payslips.length, profiles: profiles.length, anonymousOwners: owners.size, invalidRecords: invalid };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [payslipsPath, profilesPath] = process.argv.slice(2);
  if (!payslipsPath || !profilesPath) {
    console.error("Usage: node scripts/audit-legacy-payroll.mjs /secure/payslips.json /secure/profiles.json");
    process.exitCode = 2;
  } else {
    try {
      const [payslips, profiles] = await Promise.all([payslipsPath, profilesPath].map(async (file) => JSON.parse(await readFile(file, "utf8"))));
      console.log(JSON.stringify(summarizeLegacyPayroll(payslips, profiles)));
    } catch {
      console.error("Could not read valid payroll exports; no records were changed.");
      process.exitCode = 1;
    }
  }
}
