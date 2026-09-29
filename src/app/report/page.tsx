import { redirect } from "next/navigation";
import { readUserId } from "@/lib/payroll/session";
import { listDirectoryCompanies } from "@/lib/directory-store";
import { PageIntro } from "@/components/page-intro";
import { NewEmployerFlow } from "@/components/new-employer-flow";
export const metadata = { title: "Add a payslip", robots: { index: false, follow: false } };
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const { company } = await searchParams;
  const destination = "/report" + (company ? "?company=" + encodeURIComponent(company) : "");
  if (!await readUserId()) redirect("/account?next=" + encodeURIComponent(destination));
  const employer = (await listDirectoryCompanies()).find(item => item.slug === company)?.name;
  return <div className="mx-auto max-w-3xl px-4 py-10">
    <PageIntro kicker="form.kicker" title="form.title" lead="form.lead" />
    <div className="mt-8"><NewEmployerFlow defaultEmployer={employer} /></div>
  </div>;
}
