"use client";
import { useUiCopy } from "@/components/language-provider";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  JOB_TYPE_LABELS,
  SHIFT_TYPE_LABELS,
  TENURE_BAND_LABELS,
  TENURE_SOURCE_LABELS,
  VEHICLE_TYPE_LABELS,
  type EmploymentProfile,
  type JobType,
  type ShiftType,
  type TenureSource,
  type TimeFraction,
  type VehicleType,
} from "@/lib/payroll/types";
import type { PayType } from "@/lib/types";
import { payTypeLabels } from "@/lib/metrics";

type PublicProfile = Omit<EmploymentProfile, "userId">;

export function EmploymentProfileForm() {
  const tr = useUiCopy();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    employerName: "",
    employmentStartDate: "",
    tenureSource: "user_declared" as TenureSource,
    jobType: "distribution" as JobType,
    vehicleType: "articulated" as VehicleType,
    timeFraction: "full_time" as TimeFraction,
    shiftType: "day" as ShiftType,
    payType: "hourly" as PayType,
    agreedBaseRate: "",
  });

  useEffect(() => {
    fetch("/api/profile", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { profile?: PublicProfile | null }) => {
        setLoaded(true);
        if (!data.profile) return;
        setProfile(data.profile);
        setForm({
          employerName: data.profile.employerName ?? data.profile.employerSlug ?? "",
          employmentStartDate: data.profile.employmentStartDate ?? "",
          tenureSource: data.profile.tenureSource ?? "user_declared",
          jobType: data.profile.jobType,
          vehicleType: data.profile.vehicleType,
          timeFraction: data.profile.timeFraction,
          shiftType: data.profile.shiftType,
          payType: data.profile.payType,
          agreedBaseRate: data.profile.agreedBaseRate != null ? String(data.profile.agreedBaseRate) : "",
        });
      })
      .catch(() => setError("Profile could not be loaded. Reload before saving."));
  }, []);


  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          employerName: form.employerName || null,
          employmentStartDate: form.employmentStartDate || null,
          agreedBaseRate: form.agreedBaseRate ? Number(form.agreedBaseRate.replace(",", ".")) : null,
        }),
      });
      const data = (await res.json()) as { error?: string; profile?: PublicProfile };
      if (!res.ok || !data.profile) throw new Error(data.error ?? tr("Could not save"));
      setProfile(data.profile);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not save"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="text-sm leading-6 text-muted-foreground">{tr("Two drivers at the same firm may not do equivalent work. Tenure months are calculated from the start date — we do not store “years” as a typed number. A start date you type yourself is never shown as document-verified.")}</p>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{tr("Current employer")}</span>
        <Input
          value={form.employerName}
          onChange={(event) => setForm({ ...form, employerName: event.target.value })}
          placeholder={tr("Leave blank if you do not want to name the firm")}
          autoComplete="organization"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{tr("Employment start date")}</span>
          <Input
            type="date"
            value={form.employmentStartDate}
            onChange={(event) => setForm({ ...form, employmentStartDate: event.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{tr("Where that date came from")}</span>
          <select
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={form.tenureSource}
            onChange={(event) => setForm({ ...form, tenureSource: event.target.value as TenureSource })}
          >
            <option value="user_declared">{tr(TENURE_SOURCE_LABELS.user_declared)}</option>
            <option value="payslip">{tr(TENURE_SOURCE_LABELS.payslip)}</option>
            <option value="employment_contract">{tr(TENURE_SOURCE_LABELS.employment_contract)}</option>
            <option value="other_verified_document">{tr(TENURE_SOURCE_LABELS.other_verified_document)}</option>
          </select>
        </label>
      </div>
      {profile?.tenureMonths != null && profile.tenureBand ? (
        <p className="text-sm">
          <strong>{tr("Tenure: {n} months", { n: profile.tenureMonths })}</strong> ({tr(TENURE_BAND_LABELS[profile.tenureBand])}
          ). {tr(TENURE_SOURCE_LABELS[profile.tenureSource ?? "user_declared"])}
          
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{tr("Add a start date to calculate tenure in months.")}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={tr("Job type")}
          value={form.jobType}
          onChange={(value) => setForm({ ...form, jobType: value as JobType })}
          options={JOB_TYPE_LABELS}
        />
        <Select
          label={tr("Vehicle type")}
          value={form.vehicleType}
          onChange={(value) => setForm({ ...form, vehicleType: value as VehicleType })}
          options={VEHICLE_TYPE_LABELS}
        />
        <Select
          label={tr("Hours")}
          value={form.timeFraction}
          onChange={(value) => setForm({ ...form, timeFraction: value as TimeFraction })}
          options={{ full_time: tr("Full time"), part_time: tr("Part time") }}
        />
        <Select
          label={tr("Shift")}
          value={form.shiftType}
          onChange={(value) => setForm({ ...form, shiftType: value as ShiftType })}
          options={SHIFT_TYPE_LABELS}
        />
        <Select
          label={tr("How you are paid")}
          value={form.payType}
          onChange={(value) => setForm({ ...form, payType: value as PayType })}
          options={payTypeLabels}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{tr("Agreed base rate (€/hr) if known")}</span>
          <Input
            inputMode="decimal"
            value={form.agreedBaseRate}
            onChange={(event) => setForm({ ...form, agreedBaseRate: event.target.value })}
          />
        </label>
      </div>
      {error ? <p className="text-sm text-destructive">{tr(error)}</p> : null}
      {saved ? <p className="text-sm text-pay-up">{tr("Profile saved.")}</p> : null}
      <Button type="submit" disabled={pending || !loaded}>
        {pending ? tr("Saving…") : tr("Save employment profile")}
      </Button>
    </form>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
}) {
  const tr = useUiCopy();
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {Object.entries(options).map(([key, text]) => (
          <option key={key} value={key}>
            {tr(text)}
          </option>
        ))}
      </select>
    </label>
  );
}
