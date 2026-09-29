import { requireAccount } from "@/lib/payroll/session";
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  await requireAccount();
  return children;
}
