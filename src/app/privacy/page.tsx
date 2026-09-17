import type { Metadata } from "next";
import { PrivacyCopy } from "@/components/privacy-copy";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How MyTruckPay treats driver payroll data in Ireland.",
};

export default function PrivacyPage() {
  return <PrivacyCopy />;
}
