import { readUserId } from "@/lib/payroll/session";
import { getProfile } from "@/lib/payroll/profile-store";
import { hasPublicPublicationConsent } from "@/lib/payroll/publication-consent";
import type { Metadata } from "next";
import { PayslipsWorkspace } from "@/components/payslips-workspace";

export const metadata: Metadata = {
  title: "MyTruckPay",
  description: "Private Irish haulage payslips. One slip is not assumed to be one week.",
};

export default async function PayslipsPage() {
  const userId = await readUserId();
  const publicationEnabled = userId ? hasPublicPublicationConsent(await getProfile(userId)) : false;
  return <PayslipsWorkspace publicationEnabled={publicationEnabled} />;
}
