"use client";
import { useUiCopy } from "@/components/language-provider";
export function ReportIntro() {
  const tr = useUiCopy();
  return <>
    <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{tr("Public pay report")}</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{tr("Report your actual pay")}</h1>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{tr("Enter the company name and the amounts actually paid. Weekly take-home is required. This report is public; only include payroll figures, not personal information.")}</p>
  </>;
}
