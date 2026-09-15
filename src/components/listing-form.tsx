"use client";
import { useUiCopy } from "@/components/language-provider";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ListingForm() {
  const tr = useUiCopy();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    county: "",
    website: "",
    note: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? tr("Could not send"));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not send"));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="font-heading text-2xl font-semibold">{tr("Listing request in")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{tr("We will only publish public facts you confirm. Truckpay will not invent pay figures or reviews for your firm.")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{tr("Company name")}</span>
        <Input
          required
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{tr("Contact name")}</span>
          <Input
            required
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{tr("Work email")}</span>
          <Input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{tr("Phone")}</span>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{tr("County")}</span>
          <Input
            value={form.county}
            onChange={(e) => setForm({ ...form, county: e.target.value })}
            placeholder={tr("e.g. Cork")}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{tr("Website")}</span>
        <Input
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{tr("What you want listed (public facts only)")}</span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder={tr("HQ, lanes, equipment. Do not send unverified pay claims.")}
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? tr("Sending…") : tr("Request a listing")}
      </Button>
    </form>
  );
}
