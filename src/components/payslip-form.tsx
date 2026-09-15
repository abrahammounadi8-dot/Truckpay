"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PayFrequency } from "@/lib/payroll/types";

type Line = { key: string; rawLabel: string; amount: string };

const frequencies: { value: PayFrequency; label: string }[] = [
  { value: "unknown", label: "Not stated on the slip" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "lunar", label: "Lunar (4 weeks)" },
  { value: "monthly", label: "Monthly" },
];

type FormState = {
  employerName: string;
  paymentDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payFrequency: PayFrequency;
  employmentWeeks: string;
  weekNumber: string;
  basicHours: string;
  basicRate: string;
  basicPay: string;
  overtimeHours: string;
  overtimeRate: string;
  overtimePay: string;
  holidayPay: string;
  grossPay: string;
  netPay: string;
  cumulativeGross: string;
  cumulativeTax: string;
  cumulativePrsi: string;
  cumulativeUsc: string;
  cumulativePension: string;
  totalInsurableWeeks: string;
};

const DRAFT_KEY = "truckpay.payslip-draft";

const emptyForm: FormState = {
  employerName: "",
  paymentDate: "",
  payPeriodStart: "",
  payPeriodEnd: "",
  payFrequency: "unknown",
  employmentWeeks: "",
  weekNumber: "",
  basicHours: "",
  basicRate: "",
  basicPay: "",
  overtimeHours: "",
  overtimeRate: "",
  overtimePay: "",
  holidayPay: "",
  grossPay: "",
  netPay: "",
  cumulativeGross: "",
  cumulativeTax: "",
  cumulativePrsi: "",
  cumulativeUsc: "",
  cumulativePension: "",
  totalInsurableWeeks: "",
};

function emptyLine(seed?: string): Line {
  return { key: seed ?? crypto.randomUUID(), rawLabel: "", amount: "" };
}

function readDraft(): { form: FormState; allowances: Line[]; deductions: Line[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      form?: Partial<FormState>;
      allowances?: Line[];
      deductions?: Line[];
    };
    if (!parsed.form) return null;
    const legacy = parsed.form as Partial<FormState> & { employerSlug?: string };
    const form: FormState = {
      ...emptyForm,
      ...legacy,
      employerName: legacy.employerName || legacy.employerSlug || "",
    };
    return {
      form,
      allowances:
        Array.isArray(parsed.allowances) && parsed.allowances.length
          ? parsed.allowances
          : [emptyLine("allowance-seed")],
      deductions:
        Array.isArray(parsed.deductions) && parsed.deductions.length
          ? parsed.deductions
          : [emptyLine("deduction-seed")],
    };
  } catch {
    return null;
  }
}

export function PayslipForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [allowances, setAllowances] = useState<Line[]>(() => [emptyLine("allowance-seed")]);
  const [deductions, setDeductions] = useState<Line[]>(() => [emptyLine("deduction-seed")]);
  const [draftReady, setDraftReady] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoPreviewRef = useRef<string | null>(null);

  function replacePhotoPreview(file: File | undefined) {
    if (photoPreviewRef.current) {
      URL.revokeObjectURL(photoPreviewRef.current);
      photoPreviewRef.current = null;
    }
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      photoPreviewRef.current = url;
      setPhotoPreview(url);
      return;
    }
    setPhotoPreview(null);
  }

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      /* eslint-disable react-hooks/set-state-in-effect -- restore session draft once after mount */
      setForm(draft.form);
      setAllowances(draft.allowances);
      setDeductions(draft.deductions);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setDraftReady(true);
    return () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    };
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, allowances, deductions }));
  }, [draftReady, form, allowances, deductions]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setReadingFile(true);
    setError(null);
    setFileNote(null);
    replacePhotoPreview(file);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/payslips/extract", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const data = (await res.json()) as {
        error?: string;
        fileLabel?: string;
        message?: string;
        fields?: Record<string, string | number | null>;
        deductions?: { rawLabel: string; amount: number }[];
        allowances?: { rawLabel: string; amount: number }[];
      };
      if (!res.ok) throw new Error(data.error ?? "Could not read that file.");
      setFileLabel(data.fileLabel ?? file.name);
      setFileNote(data.message ?? "File read. The original was not stored.");
      applyExtracted(data.fields ?? {}, data.deductions ?? [], data.allowances ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setReadingFile(false);
    }
  }

  function applyExtracted(
    fields: Record<string, string | number | null>,
    extractedDeductions: { rawLabel: string; amount: number }[],
    extractedAllowances: { rawLabel: string; amount: number }[],
  ) {
    setForm((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(emptyForm) as (keyof FormState)[]) {
        const value = fields[key];
        if (value == null || value === "") continue;
        (next as Record<string, string>)[key] = String(value);
      }
      return next;
    });
    if (extractedDeductions.length) {
      setDeductions(extractedDeductions.map((line) => ({ key: crypto.randomUUID(), rawLabel: line.rawLabel, amount: String(line.amount) })));
    }
    if (extractedAllowances.length) {
      setAllowances(extractedAllowances.map((line) => ({ key: crypto.randomUUID(), rawLabel: line.rawLabel, amount: String(line.amount) })));
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/payslips", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          employerName: form.employerName || null,
          allowances: packed(allowances),
          deductions: packed(deductions),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        payslip?: { id: string };
        readyForAnalysis?: boolean;
        duplicateOf?: string;
      };
      if (res.status === 409) {
        throw new Error(data.error ?? "Duplicate payslip.");
      }
      if (!res.ok || !data.payslip) {
        throw new Error(data.error ?? "Could not save the payslip.");
      }
      sessionStorage.removeItem(DRAFT_KEY);
      replacePhotoPreview(undefined);
      const next = data.readyForAnalysis ? "/analysis" : `/payslips/${data.payslip.id}`;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} autoComplete="off" className="space-y-8">
      <section
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? "border-accent bg-accent/10" : "border-foreground/20 bg-card"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void onPickFile(event.dataTransfer.files[0]);
        }}
      >
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL, never stored
          <img
            src={photoPreview}
            alt="Payslip photo you attached. Not stored on the server."
            className="mx-auto max-h-64 w-full max-w-md rounded-lg object-contain ring-1 ring-foreground/10"
          />
        ) : (
          <FileUpIcon className="mx-auto size-10 text-accent" aria-hidden />
        )}
        <h2 className="font-heading mt-3 text-2xl font-semibold">Put your payslip here</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Pon la nómina aquí. Arrastra un PDF o una foto, o elige un archivo. TruckPay lee el archivo y lo
          descarta — no lo guarda.
        </p>
        <label className="mt-4 inline-flex cursor-pointer flex-col items-center gap-2">
          <span className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
            {readingFile ? "Reading…" : "Choose PDF or photo"}
          </span>
          <input
            ref={fileInputRef}
            id="payslip-file"
            name="payslip-file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
            disabled={readingFile}
            className="max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onPickFile(file);
            }}
          />
        </label>
        {fileLabel ? (
          <p className="mt-3 text-sm font-medium">
            Attached: {fileLabel}
            <span className="block text-xs font-normal text-muted-foreground">Not stored on the server</span>
          </p>
        ) : null}
        {fileNote ? <p className="mt-2 text-sm text-muted-foreground">{fileNote}</p> : null}
      </section>

      <p className="rounded-xl bg-card p-4 text-sm leading-6 text-muted-foreground ring-1 ring-foreground/10">
        After the file, check the boxes below. Leave a box blank if it is not printed — TruckPay will
        store null and will not guess. TruckPay Verified Analysis needs your latest three unique
        payslips. A payslip is not assumed to be one week.
      </p>

      <Section title="Who and when">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment date">
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              required
              value={form.paymentDate}
              onChange={(event) => set("paymentDate", event.target.value)}
            />
          </Field>
          <Field label="Employer as printed">
            <Input
              id="employerName"
              name="employerName"
              value={form.employerName}
              onChange={(event) => set("employerName", event.target.value)}
              placeholder="Leave blank if not on the slip"
              autoComplete="organization"
            />
          </Field>
          <Field label="Period start">
            <Input
              id="payPeriodStart"
              name="payPeriodStart"
              type="date"
              value={form.payPeriodStart}
              onChange={(event) => set("payPeriodStart", event.target.value)}
            />
          </Field>
          <Field label="Period end">
            <Input
              id="payPeriodEnd"
              name="payPeriodEnd"
              type="date"
              value={form.payPeriodEnd}
              onChange={(event) => set("payPeriodEnd", event.target.value)}
            />
          </Field>
          <Field label="Pay frequency as printed">
            <select
              id="payFrequency"
              name="payFrequency"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={form.payFrequency}
              onChange={(event) => set("payFrequency", event.target.value as PayFrequency)}
            >
              {frequencies.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employment / insurable weeks on this slip">
            <Input
              id="employmentWeeks"
              name="employmentWeeks"
              inputMode="decimal"
              value={form.employmentWeeks}
              onChange={(event) => set("employmentWeeks", event.target.value)}
              placeholder="May be more than 1"
            />
          </Field>
          <Field label="Week number as printed">
            <Input
              id="weekNumber"
              name="weekNumber"
              inputMode="numeric"
              value={form.weekNumber}
              onChange={(event) => set("weekNumber", event.target.value)}
              placeholder="Leave blank if not shown"
            />
          </Field>
        </div>
      </Section>

      <Section title="Basic and overtime">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Basic hours">
            <Input id="basicHours" name="basicHours" inputMode="decimal" value={form.basicHours} onChange={(event) => set("basicHours", event.target.value)} />
          </Field>
          <Field label="Basic rate (€)">
            <Input id="basicRate" name="basicRate" inputMode="decimal" value={form.basicRate} onChange={(event) => set("basicRate", event.target.value)} />
          </Field>
          <Field label="Basic pay (€)">
            <Input id="basicPay" name="basicPay" inputMode="decimal" value={form.basicPay} onChange={(event) => set("basicPay", event.target.value)} />
          </Field>
          <Field label="Overtime hours">
            <Input inputMode="decimal" value={form.overtimeHours} onChange={(event) => set("overtimeHours", event.target.value)} />
          </Field>
          <Field label="Overtime rate (€)">
            <Input inputMode="decimal" value={form.overtimeRate} onChange={(event) => set("overtimeRate", event.target.value)} />
          </Field>
          <Field label="Overtime pay (€)">
            <Input inputMode="decimal" value={form.overtimePay} onChange={(event) => set("overtimePay", event.target.value)} />
          </Field>
          <Field label="Holiday pay (€)">
            <Input id="holidayPay" name="holidayPay" inputMode="decimal" value={form.holidayPay} onChange={(event) => set("holidayPay", event.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Gross, net, year to date">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gross pay (€)">
            <Input id="grossPay" name="grossPay" inputMode="decimal" value={form.grossPay} onChange={(event) => set("grossPay", event.target.value)} />
          </Field>
          <Field label="Net pay (€)">
            <Input id="netPay" name="netPay" inputMode="decimal" value={form.netPay} onChange={(event) => set("netPay", event.target.value)} />
          </Field>
          <Field label="Cumulative gross (€)">
            <Input inputMode="decimal" value={form.cumulativeGross} onChange={(event) => set("cumulativeGross", event.target.value)} />
          </Field>
          <Field label="Cumulative tax (€)">
            <Input inputMode="decimal" value={form.cumulativeTax} onChange={(event) => set("cumulativeTax", event.target.value)} />
          </Field>
          <Field label="Cumulative PRSI (€)">
            <Input inputMode="decimal" value={form.cumulativePrsi} onChange={(event) => set("cumulativePrsi", event.target.value)} />
          </Field>
          <Field label="Cumulative USC (€)">
            <Input inputMode="decimal" value={form.cumulativeUsc} onChange={(event) => set("cumulativeUsc", event.target.value)} />
          </Field>
          <Field label="Cumulative pension (€)">
            <Input inputMode="decimal" value={form.cumulativePension} onChange={(event) => set("cumulativePension", event.target.value)} />
          </Field>
          <Field label="Total insurable weeks (YTD)">
            <Input inputMode="decimal" value={form.totalInsurableWeeks} onChange={(event) => set("totalInsurableWeeks", event.target.value)} />
          </Field>
        </div>
      </Section>

      <Section
        title="Allowances"
        action={
          <Button type="button" id="add-allowance" size="sm" variant="outline" onClick={() => setAllowances((rows) => [...rows, emptyLine()])}>
            Add line
          </Button>
        }
      >
        <LineTable
          rows={allowances}
          onChange={setAllowances}
          labelPlaceholder="e.g. Night out, subsistence"
          namePrefix="allowance"
        />
      </Section>

      <Section
        title="Deductions"
        action={
          <Button type="button" id="add-deduction" size="sm" variant="outline" onClick={() => setDeductions((rows) => [...rows, emptyLine()])}>
            Add line
          </Button>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Copy the label exactly as printed. Unknown labels stay unknown and are flagged for review.
          Truckpay will not mark a deduction as illegal.
        </p>
        <LineTable
          rows={deductions}
          onChange={setDeductions}
          labelPlaceholder="e.g. PAYE, PRSI, uniform"
          namePrefix="deduction"
        />
      </Section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="bg-accent text-accent-foreground hover:bg-accent/90">
        {pending ? "Checking…" : "Check this payslip"}
      </Button>
    </form>
  );
}

function packed(rows: Line[]) {
  return rows
    .filter((row) => row.rawLabel.trim() && row.amount.trim())
    .map((row) => ({ rawLabel: row.rawLabel.trim(), amount: Number(row.amount.replace(",", ".")) }));
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function LineTable({
  rows,
  onChange,
  labelPlaceholder,
  namePrefix,
}: {
  rows: Line[];
  onChange: (rows: Line[]) => void;
  labelPlaceholder: string;
  namePrefix: string;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input
            name={`${namePrefix}-label-${index}`}
            value={row.rawLabel}
            placeholder={labelPlaceholder}
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...row, rawLabel: event.target.value };
              onChange(next);
            }}
          />
          <Input
            name={`${namePrefix}-amount-${index}`}
            inputMode="decimal"
            placeholder="€"
            value={row.amount}
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...row, amount: event.target.value };
              onChange(next);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(rows.filter((item) => item.key !== row.key).length ? rows.filter((item) => item.key !== row.key) : [emptyLine()])}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
