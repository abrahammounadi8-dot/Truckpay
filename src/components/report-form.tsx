"use client";
import { useMarket } from "./market-provider";
import { useUiCopy } from "@/components/language-provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { equipmentLabels, operationLabels, payTypeLabels } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import type { Equipment, Operation, PayType } from "@/lib/types";

const payTypes: PayType[] = ["hourly", "day", "salary", "percentage"];
const equipment: Equipment[] = ["curtain", "reefer", "flatbed", "tanker", "specialized"];
const operations: Operation[] = ["domestic", "uk", "europe"];

export function ReportForm({ defaultCompany }: { defaultCompany?: string }) {
  const tr = useUiCopy();
  const market = useMarket();
  const router = useRouter();
  const { submitReport, companies } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    companyName: defaultCompany ?? "",
    role: market === "US" ? "Truck driver" : "HGV driver",
    tenure: "1–2 years",
    payType: "hourly" as PayType,
    equipment: "curtain" as Equipment,
    operation: "domestic" as Operation,
    ratePerMile: "",
    hourlyRate: "",
    weeklyPay: "",
    kmPerWeek: "",
    hoursPerWeek: "45",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const saved = await submitReport({
        countryCode: market,
        companySlug: "",
        companyName: form.companyName,
        role: form.role,
        tenure: form.tenure,
        payType: form.payType,
        equipment: form.equipment,
        operation: form.operation,
        ratePerMile: market === "US" && form.ratePerMile ? Number(form.ratePerMile) : undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        weeklyPay: Number(form.weeklyPay),
        kmPerWeek: form.kmPerWeek ? Number(form.kmPerWeek) * (market === "US" ? 1.609344 : 1) : undefined,
        hoursPerWeek: Number(form.hoursPerWeek),
        body: "",
      });
      router.push(`/companies/${saved.companySlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not save"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <Field label={tr("Haulage firm")}>
        <Input
          list="report-company-suggestions"
          value={form.companyName}
          onChange={(event) => set("companyName", event.target.value)}
          placeholder={tr("Company name")}
          maxLength={120}
          required
        />
        <datalist id="report-company-suggestions">
          {companies.map((company) => <option key={company.slug} value={company.name} />)}
        </datalist>
        <p className="text-xs text-muted-foreground">{tr("Type any company name. Suggestions are optional.")}</p>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={tr("Job title")}>
          <Input value={form.role} onChange={(event) => set("role", event.target.value)} />
        </Field>
        <Field label={tr("How long there")}>
          <Input value={form.tenure} onChange={(event) => set("tenure", event.target.value)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={tr("How you are paid")}>
          <select
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={form.payType}
            onChange={(event) => set("payType", event.target.value as PayType)}
          >
            {(market === "US" ? [...payTypes, "mile" as const] : payTypes).map((payType) => (
              <option key={payType} value={payType}>
                {tr(payTypeLabels[payType])}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr("Trailer / work")}>
          <select
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={form.equipment}
            onChange={(event) => set("equipment", event.target.value as Equipment)}
          >
            {equipment.map((item) => (
              <option key={item} value={item}>
                {tr(equipmentLabels[item])}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tr("Usual lanes")}>
          <select
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            value={form.operation}
            onChange={(event) => set("operation", event.target.value as Operation)}
          >
            {(market === "US" ? operations.filter(item => item === "domestic") : operations).map((item) => (
              <option key={item} value={item}>
                {tr(operationLabels[item])}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {market === "US" && form.payType === "mile" && <Field label="USD per mile — required"><Input inputMode="decimal" value={form.ratePerMile} onChange={event => set("ratePerMile", event.target.value)} required /></Field>}
        <Field label={market === "US" ? "Weekly take-home ($) — required" : tr("Weekly take-home (€) — required")}>
          <Input
            inputMode="decimal"
            value={form.weeklyPay}
            onChange={(event) => set("weeklyPay", event.target.value)}
            placeholder={tr("What actually landed")}
            required
          />
        </Field>
        <Field label={market === "US" ? "Hourly rate ($) — optional" : tr("Hourly rate (€) — optional")}>
          <Input
            inputMode="decimal"
            value={form.hourlyRate}
            onChange={(event) => set("hourlyRate", event.target.value)}
          />
        </Field>
        <Field label={tr("Hours / week")}>
          <Input
            inputMode="numeric"
            value={form.hoursPerWeek}
            onChange={(event) => set("hoursPerWeek", event.target.value)}
            required
          />
        </Field>
        <Field label={market === "US" ? "Miles / week — optional" : tr("Km / week — optional")}>
          <Input
            inputMode="numeric"
            value={form.kmPerWeek}
            onChange={(event) => set("kmPerWeek", event.target.value)}
          />
        </Field>
      </div>
      {error ? <p className="text-sm text-destructive">{tr(error)}</p> : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? tr("Filing…") : tr("File wage slip")}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
