import { WelcomeBoard } from "@/components/welcome-board";
import { getComparisonAccess } from "@/lib/payroll/access";

export default async function HomePage() {
  return <WelcomeBoard access={await getComparisonAccess()} />;
}
