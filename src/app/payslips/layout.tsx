import { requireAccount } from "@/lib/payroll/session";
export default async function PayslipLayout({ children }: { children: React.ReactNode }) {
  await requireAccount();
  return children;
}
