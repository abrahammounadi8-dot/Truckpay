import type { Metadata } from "next";
import { VerifyLink } from "@/components/verify-link";

export const metadata: Metadata = { title: "Verify email", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function VerifyPage() {
  return <main className="mx-auto max-w-lg px-4 py-12"><h1 className="font-heading text-3xl">Verify your email</h1><p className="my-4">Confirm to access your private payslips on this device.</p><VerifyLink /></main>;
}
