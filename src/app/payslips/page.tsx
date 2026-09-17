import type { Metadata } from "next";
import { PayslipsWorkspace } from "@/components/payslips-workspace";

export const metadata: Metadata = {
  title: "MyTruckPay",
  description: "Private Irish haulage payslips. One slip is not assumed to be one week.",
};

export default function PayslipsPage() {
  return <PayslipsWorkspace />;
}
