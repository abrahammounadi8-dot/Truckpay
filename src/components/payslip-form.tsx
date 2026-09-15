"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon } from "lucide-react";
import { useT, useUiCopy } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { frequencyMessageKey } from "@/lib/i18n";
import type { PayFrequency } from "@/lib/payroll/types";

import { draftFromExtraction, emptyForm, emptyLine, type FormState, type Line } from "@/lib/payroll/form-draft";

const DRAFT_KEY = "truckpay.payslip-draft";

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
  const { t } = useT();
  const tr = useUiCopy();
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
  const fileReadLock = useRef(false);

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

  function applyExtracted(
    fields: Record<string, string | number | null>,
    extractedDeductions: { rawLabel: string; amount: number }[],
    extractedAllowances: { rawLabel: string; amount: number }[],
  ) {
    const draft = draftFromExtraction(fields, extractedDeductions, extractedAllowances);
    setForm(draft.form);
    setDeductions(draft.deductions);
    setAllowances(draft.allowances);
  }

  async function onPickFile(file: File | undefined) {
    if (!file || fileReadLock.current || pending) return;
    fileReadLock.current = true;
    setReadingFile(true);
    setError(null);

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
        kind?: string;
        fileLabel?: string;
        message?: string;
        filledKeys?: string[];
        fields?: Record<string, string | number | null>;
        deductions?: { rawLabel: string; amount: number }[];
        allowances?: { rawLabel: string; amount: number }[];
      };
      if (!res.ok) throw new Error(data.error ?? t("form.readError"));
      if (data.kind === "unsupported") throw new Error(data.message ?? t("form.readError"));
      replacePhotoPreview(file);
      setFileLabel(data.fileLabel ?? file.name);
      const fieldCount = data.filledKeys?.length ?? 0;
      setFileNote(fieldCount
        ? `Read ${fieldCount} labelled fields. Check every value; missing figures are not guessed. The original file is not retained.`
        : "No labelled figures could be read. Enter the printed values. The original file is not retained.");
      applyExtracted(data.fields ?? {}, data.deductions ?? [], data.allowances ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.readError"));
    } finally {
      fileReadLock.current = false;
      setReadingFile(false);
    }
  }

  const onPickFileRef = useRef(onPickFile);
  useEffect(() => {
    onPickFileRef.current = onPickFile;
  });

  useEffect(() => {
    const el = fileInputRef.current;
    if (!el) return;
    const onChange = () => {
      const file = el.files?.[0];
      if (file) void onPickFileRef.current(file);
    };
    el.addEventListener("change", onChange);
    return () => el.removeEventListener("change", onChange);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (fileReadLock.current || pending) return;
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
        throw new Error(data.error ?? t("form.duplicate"));
      }
      if (!res.ok || !data.payslip) {
        throw new Error(data.error ?? t("form.saveError"));
      }
      sessionStorage.removeItem(DRAFT_KEY);
      replacePhotoPreview(undefined);
      const next = data.readyForAnalysis ? "/analysis" : `/payslips/${data.payslip.id}`;
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("form.saveError"));
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
            alt={t("form.photoAlt")}
            className="mx-auto max-h-64 w-full max-w-md rounded-lg object-contain ring-1 ring-foreground/10"
          />
        ) : (
          <FileUpIcon className="mx-auto size-10 text-accent" aria-hidden />
        )}
        <h2 className="font-heading mt-3 text-2xl font-semibold">{t("form.putHere")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {t("form.putHereHelp")}
        </p>
        <label className="mt-4 inline-flex cursor-pointer flex-col items-center gap-2">
          <span className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
            {readingFile ? t("form.reading") : t("form.chooseFile")}
          </span>
          <input
            ref={fileInputRef}
            id="payslip-file"
            name="payslip-file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
            disabled={readingFile || pending}
            className="max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </label>
        {fileLabel ? (
          <p className="mt-3 text-sm font-medium">
            {t("form.attached", { name: fileLabel })}
            <span className="block text-xs font-normal text-muted-foreground">{t("form.notStored")}</span>
          </p>
        ) : null}
        {fileNote ? <p className="mt-2 text-sm text-muted-foreground">{tr(fileNote)}</p> : null}
      </section>

      <p className="rounded-xl bg-card p-4 text-sm leading-6 text-muted-foreground ring-1 ring-foreground/10">
        {t("form.afterFile")}
      </p>

      <fieldset disabled={readingFile || pending} className="space-y-8 min-w-0">
      <Section title={t("form.whoWhen")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("form.paymentDate")}>
            <Input
              id="paymentDate"
              name="paymentDate"
              type="date"
              required
              value={form.paymentDate}
              onChange={(event) => set("paymentDate", event.target.value)}
            />
          </Field>
          <Field label={t("form.employer")}>
            <Input
              id="employerName"
              name="employerName"
              value={form.employerName}
              onChange={(event) => set("employerName", event.target.value)}
              placeholder={t("form.employerPlaceholder")}
              autoComplete="organization"
            />
          </Field>
          <Field label={t("form.periodStart")}>
            <Input
              id="payPeriodStart"
              name="payPeriodStart"
              type="date"
              value={form.payPeriodStart}
              onChange={(event) => set("payPeriodStart", event.target.value)}
            />
          </Field>
          <Field label={t("form.periodEnd")}>
            <Input
              id="payPeriodEnd"
              name="payPeriodEnd"
              type="date"
              value={form.payPeriodEnd}
              onChange={(event) => set("payPeriodEnd", event.target.value)}
            />
          </Field>
          <Field label={t("form.frequency")}>
            <select
              id="payFrequency"
              name="payFrequency"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={form.payFrequency}
              onChange={(event) => set("payFrequency", event.target.value as PayFrequency)}
            >
              {(["unknown", "weekly", "fortnightly", "lunar", "monthly"] as PayFrequency[]).map((value) => (
                <option key={value} value={value}>
                  {t(frequencyMessageKey(value))}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("form.employmentWeeks")}>
            <Input
              id="employmentWeeks"
              name="employmentWeeks"
              inputMode="decimal"
              value={form.employmentWeeks}
              onChange={(event) => set("employmentWeeks", event.target.value)}
              placeholder={t("form.employmentWeeksPlaceholder")}
            />
          </Field>
          <Field label={t("form.weekNumber")}>
            <Input
              id="weekNumber"
              name="weekNumber"
              inputMode="numeric"
              value={form.weekNumber}
              onChange={(event) => set("weekNumber", event.target.value)}
              placeholder={t("form.weekPlaceholder")}
            />
          </Field>
        </div>
      </Section>

      <Section title={t("form.basicOt")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("form.basicHours")}>
            <Input id="basicHours" name="basicHours" inputMode="decimal" value={form.basicHours} onChange={(event) => set("basicHours", event.target.value)} />
          </Field>
          <Field label={t("form.basicRate")}>
            <Input id="basicRate" name="basicRate" inputMode="decimal" value={form.basicRate} onChange={(event) => set("basicRate", event.target.value)} />
          </Field>
          <Field label={t("form.basicPay")}>
            <Input id="basicPay" name="basicPay" inputMode="decimal" value={form.basicPay} onChange={(event) => set("basicPay", event.target.value)} />
          </Field>
          <Field label={t("form.overtimeHours")}>
            <Input inputMode="decimal" value={form.overtimeHours} onChange={(event) => set("overtimeHours", event.target.value)} />
          </Field>
          <Field label={t("form.overtimeRate")}>
            <Input inputMode="decimal" value={form.overtimeRate} onChange={(event) => set("overtimeRate", event.target.value)} />
          </Field>
          <Field label={t("form.overtimePay")}>
            <Input inputMode="decimal" value={form.overtimePay} onChange={(event) => set("overtimePay", event.target.value)} />
          </Field>
          <Field label={t("form.holidayPay")}>
            <Input id="holidayPay" name="holidayPay" inputMode="decimal" value={form.holidayPay} onChange={(event) => set("holidayPay", event.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title={t("form.totals")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("form.gross")}>
            <Input id="grossPay" name="grossPay" inputMode="decimal" value={form.grossPay} onChange={(event) => set("grossPay", event.target.value)} />
          </Field>
          <Field label={t("form.net")}>
            <Input id="netPay" name="netPay" inputMode="decimal" value={form.netPay} onChange={(event) => set("netPay", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativeGross")}>
            <Input inputMode="decimal" value={form.cumulativeGross} onChange={(event) => set("cumulativeGross", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativeTax")}>
            <Input inputMode="decimal" value={form.cumulativeTax} onChange={(event) => set("cumulativeTax", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativePrsi")}>
            <Input inputMode="decimal" value={form.cumulativePrsi} onChange={(event) => set("cumulativePrsi", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativeUsc")}>
            <Input inputMode="decimal" value={form.cumulativeUsc} onChange={(event) => set("cumulativeUsc", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativePension")}>
            <Input inputMode="decimal" value={form.cumulativePension} onChange={(event) => set("cumulativePension", event.target.value)} />
          </Field>
          <Field label={t("form.ytdWeeks")}>
            <Input inputMode="decimal" value={form.totalInsurableWeeks} onChange={(event) => set("totalInsurableWeeks", event.target.value)} />
          </Field>
        </div>
      </Section>

      <Section
        title={t("form.allowances")}
        action={
          <Button type="button" id="add-allowance" size="sm" variant="outline" onClick={() => setAllowances((rows) => [...rows, emptyLine()])}>
            {t("form.addLine")}
          </Button>
        }
      >
        <LineTable
          rows={allowances}
          onChange={setAllowances}
          labelPlaceholder={t("form.allowancePlaceholder")}
          namePrefix="allowance"
          removeLabel={t("form.remove")}
        />
      </Section>

      <Section
        title={t("form.deductions")}
        action={
          <Button type="button" id="add-deduction" size="sm" variant="outline" onClick={() => setDeductions((rows) => [...rows, emptyLine()])}>
            {t("form.addLine")}
          </Button>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">{t("form.deductionHelp")}</p>
        <LineTable
          rows={deductions}
          onChange={setDeductions}
          labelPlaceholder={t("form.deductionPlaceholder")}
          namePrefix="deduction"
          removeLabel={t("form.remove")}
        />
      </Section>

      </fieldset>
      {error ? <p className="text-sm text-destructive">{tr(error)}</p> : null}
      <Button type="submit" disabled={pending || readingFile} className="bg-accent text-accent-foreground hover:bg-accent/90">
        {pending ? t("form.checking") : t("form.check")}
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
  removeLabel,
}: {
  rows: Line[];
  onChange: (rows: Line[]) => void;
  labelPlaceholder: string;
  namePrefix: string;
  removeLabel: string;
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
            {removeLabel}
          </Button>
        </div>
      ))}
    </div>
  );
}
