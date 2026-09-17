import { HomeAccessBanner } from "@/components/home-access-banner";
import { HomeBoard } from "@/components/home-board";
import { getComparisonAccess } from "@/lib/payroll/access";

export default async function HomePage() {
  return (
    <>
      <HomeAccessBanner access={await getComparisonAccess()} />
      <HomeBoard />
    </>
  );
}
