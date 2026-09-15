import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { EmploymentProfileForm } from "@/components/employment-profile-form";

export const metadata: Metadata = {
  title: "Employment profile",
  description: "Current job, vehicle, shift and tenure. Tenure is calculated from the start date.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageIntro kicker="profile.kicker" title="profile.title" lead="profile.lead" />
      <div className="mt-8">
        <EmploymentProfileForm />
      </div>
    </div>
  );
}
