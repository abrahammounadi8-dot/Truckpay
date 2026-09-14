/**
 * Persistence ports. The live app still uses JSON files via store.ts.
 * Postgres (or similar) can implement this later without changing payroll logic.
 *
 * Do not treat JSON-on-disk or Vercel /tmp as the long-term store.
 */
import type { EmploymentProfile, Payslip } from "@/lib/payroll/types";

export type PayrollRepository = {
  listPayslipsForUser(userId: string): Promise<Payslip[]>;
  listAllPayslips(): Promise<Payslip[]>;
  getPayslipForUser(userId: string, id: string): Promise<Payslip | null>;
  savePayslip(slip: Payslip): Promise<Payslip>;
  deletePayslip(userId: string, id: string): Promise<boolean>;
  deleteAllForUser(userId: string): Promise<number>;
};

export type ProfileRepository = {
  getProfile(userId: string): Promise<EmploymentProfile | null>;
  listProfiles(): Promise<EmploymentProfile[]>;
  saveProfile(profile: EmploymentProfile): Promise<EmploymentProfile>;
  deleteProfile(userId: string): Promise<boolean>;
};
