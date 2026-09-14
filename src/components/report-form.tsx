"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { fleet } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import type { PayType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReportForm({ defaultCompany }: { defaultCompany?: string }) {
  const { submitReport } = useAppStore();
  const [companySlug, setCompanySlug] = useState(defaultCompany ?? "");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("");
  const [tenure, setTenure] = useState("1–2 years");
  const [payType, setPayType] = useState<PayType>("cpm");
  const [cpm, setCpm] = useState("");
  const [weeklyPay, setWeeklyPay] = useState("");
  const [miles, setMiles] = useState("");
  const [homeTime, setHomeTime] = useState("");
  const [rating, setRating] = useState("3");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recommend, setRecommend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const company = useMemo(
    () => fleet.find((item) => item.slug === companySlug),
    [companySlug],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const weekly = Number(weeklyPay);
    const milesNum = Number(miles);
    const ratingNum = Number(rating);
    if (!companySlug) {
      setError("Pick the carrier you drove for.");
      return;
    }
    if (!title.trim() || !body.trim() || !nickname.trim()) {
      setError("Need a nickname, a headline, and the story.");
      return;
    }
    if (!Number.isFinite(weekly) || weekly <= 0) {
      setError("Weekly take-home has to be a number.");
      return;
    }
    if (!Number.isFinite(milesNum) || milesNum <= 0) {
      setError("Miles per week has to be a number.");
      return;
    }
    setSubmitting(true);
    try {
      const saved = await submitReport({
        companySlug,
        nickname: nickname.trim(),
        role: role.trim() || "Driver",
        tenure,
        payType,
        cpm: cpm ? Number(cpm) : undefined,
        weeklyPay: weekly,
        milesPerWeek: milesNum,
        homeTime: homeTime.trim() || "Not specified",
        rating: ratingNum,
        title: title.trim(),
        body: body.trim(),
        wouldRecommend: recommend,
      });
      setSavedId(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not file the report.");
    } finally {
      setSubmitting(false);
    }
  }

  if (savedId && company) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <p className="font-heading text-2xl font-semibold">Report filed</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          It is on the {company.name} file. Anyone on this Truckpay instance can
          read the settlement numbers you posted.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={`/companies/${company.slug}`} className={cn(buttonVariants())}>
            See it on the company file
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              setSavedId(null);
              setTitle("");
              setBody("");
              setWeeklyPay("");
            }}
          >
            File another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Carrier">
          <Select value={companySlug || null} onValueChange={(value) => setCompanySlug(value ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {fleet.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Nickname shown on the report">
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="OTR_Maria" />
        </Field>
        <Field label="Seat / account">
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Solo reefer, dedicated" />
        </Field>
        <Field label="Tenure">
          <Select value={tenure} onValueChange={(value) => setTenure(value ?? tenure)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Under a year">Under a year</SelectItem>
              <SelectItem value="1–2 years">1–2 years</SelectItem>
              <SelectItem value="2–5 years">2–5 years</SelectItem>
              <SelectItem value="5+ years">5+ years</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Pay type">
          <Select value={payType} onValueChange={(value) => setPayType((value as PayType) ?? "cpm")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpm">Per mile</SelectItem>
              <SelectItem value="salary">Salary</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="CPM you actually ran (optional)">
          <Input
            inputMode="decimal"
            value={cpm}
            onChange={(e) => setCpm(e.target.value)}
            placeholder="0.52"
          />
        </Field>
        <Field label="Average weekly take-home">
          <Input
            inputMode="numeric"
            value={weeklyPay}
            onChange={(e) => setWeeklyPay(e.target.value)}
            placeholder="1350"
          />
        </Field>
        <Field label="Miles per week">
          <Input
            inputMode="numeric"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            placeholder="2400"
          />
        </Field>
        <Field label="Home time">
          <Input
            value={homeTime}
            onChange={(e) => setHomeTime(e.target.value)}
            placeholder="14 days out, 2 home"
          />
        </Field>
        <Field label="Rating">
          <Select value={rating} onValueChange={(value) => setRating(value ?? "3")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 — walk away</SelectItem>
              <SelectItem value="2">2 — only if desperate</SelectItem>
              <SelectItem value="3">3 — mixed</SelectItem>
              <SelectItem value="4">4 — would recommend</SelectItem>
              <SelectItem value="5">5 — closest to the ad</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Headline">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="The 0.60 was loaded miles after six months"
        />
      </Field>
      <Field label="What actually hit the settlement">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Miles, detention, escrow, truck age, whether home time was real..."
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={recommend} onCheckedChange={(value) => setRecommend(value === true)} />
        I would take this job again
      </label>
      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? "Filing…" : "File report"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
