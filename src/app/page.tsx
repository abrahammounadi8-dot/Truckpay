import { VisitorHome } from "@/components/visitor-home";
import { readUserId } from "@/lib/payroll/session";
import { SignedInHome } from "@/components/signed-in-home";
export default async function HomePage() {
  if (!await readUserId()) return <VisitorHome />;
  return <SignedInHome />;
}
