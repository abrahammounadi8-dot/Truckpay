import type { Metadata } from "next";
import { EmploymentProfileForm } from "@/components/employment-profile-form";

export const metadata: Metadata = {
  title: "Employment profile",
  description: "Current job, vehicle, shift and tenure. Tenure is calculated from the start date.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        This job only
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Employment profile</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Country is Ireland for now. Do not enter a PPSN, licence or employee number. Two people at
        the same haulier are not assumed to do the same work.
      </p>
      <div className="mt-8">
        <EmploymentProfileForm />
      </div>
    </div>
  );
}
