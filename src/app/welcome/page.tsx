import { WelcomeBoard } from "@/components/welcome-board";
import { getComparisonAccess } from "@/lib/payroll/access";

export default async function WelcomePage() {
  return <WelcomeBoard access={await getComparisonAccess()} />;
}
