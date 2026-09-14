import type { Metadata } from "next";
import { PayslipDetail } from "@/components/payslip-detail";

export const metadata: Metadata = {
  title: "Payslip",
};

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PayslipDetail id={id} />
    </div>
  );
}
