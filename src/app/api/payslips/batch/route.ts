import { privateApiIdentity, privateJson } from "@/lib/payroll/session";
import { database, usesDatabase } from "@/lib/persistence/database";
import { DocumentRepository, DuplicatePayslipError } from "@/lib/persistence/documents";
import { preparePayslipBatch } from "@/lib/payroll/prepare-batch";
import { toStoredProfile } from "@/lib/payroll/profile";
import { validateEmploymentStart } from "@/lib/payroll/employment-month";
import type { EmploymentProfile, Payslip } from "@/lib/payroll/types";
export const runtime = "nodejs";
export async function POST(request: Request) {
 const userId = await privateApiIdentity(request); if (userId instanceof Response) return userId;
 let records: Payslip[]; let startMonth: string;
 try { const body = await request.json(); records = preparePayslipBatch(userId, body?.payslips, body?.startMonth); startMonth = body.startMonth; }
 catch(e) { return privateJson({error:e instanceof Error ? e.message : "Revisa los datos."},{status:422}); }
 if (!usesDatabase()) return privateJson({error:"Configura la base de datos para guardar las tres nóminas juntas."},{status:503});
 const client = await database().connect();
 try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[userId]);
  const repository = new DocumentRepository(client);
  const existing = await repository.list<Payslip>("payslip",userId);
  const startError = validateEmploymentStart(startMonth,records[0].employerSlug!,[...existing,...records]);
  if(startError) { await client.query("ROLLBACK"); return privateJson({error:startError},{status:422}); }
  const current = await repository.get<EmploymentProfile>("profile",userId,userId);
  const first = records[0];
  const base = current ?? toStoredProfile(userId,{countryCode:first.countryCode === "US" ? "US" : "IE",employerName:first.employerName,employerSlug:first.employerSlug},new Date().toISOString().slice(0,10));
  const profile: EmploymentProfile = {...base,employmentStarts:{...base.employmentStarts,[first.employerSlug!]:{employerName:first.employerName!,startMonth,source:"user_declared",updatedAt:new Date().toISOString()}}};
  for(const record of records) await repository.save("payslip",userId,record.id,record,record.contentHash);
  await repository.save("profile",userId,userId,profile);
  await client.query("COMMIT");
  return privateJson({ok:true},{status:201});
 } catch(e) { await client.query("ROLLBACK"); return privateJson({error:e instanceof DuplicatePayslipError ? "Una de estas nóminas ya está guardada. Revisa Mis nóminas antes de repetir." : "No se ha guardado el grupo. Inténtalo de nuevo."},{status:e instanceof DuplicatePayslipError?409:503}); }
 finally { client.release(); }
}
