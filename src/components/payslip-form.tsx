"use client";

import { isValidElement, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GmailImport } from "./gmail-import";
import { FileUpIcon } from "lucide-react";
import { useT, useUiCopy } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { frequencyMessageKey, type Locale } from "@/lib/i18n";
import type { PayFrequency } from "@/lib/payroll/types";
import { extractionError } from "@/lib/payroll/extraction-error";
import { filesForImport, preferredEmployer } from "@/lib/payroll/import-policy";

import { EmploymentStartField } from "./employment-start-field";
import { draftFromExtraction, emptyForm, emptyLine, type FormState, type Line } from "@/lib/payroll/form-draft";

const formCopy: Record<Locale, { manual: string; review: string; help: string; details: string; unread: string; save: string; retry: string }> = {
  "en": {
    "manual": "Enter without a file",
    "review": "Review your payslip",
    "help": "Check the figures and complete missing essentials. Leave information not printed on your payslip blank.",
    "details": "View or correct details",
    "unread": "We could not read the figures. Try a clearer photo or a PDF, or enter them manually.",
    "save": "Confirm and save",
    "retry": "Try another file"
  },
  "es": {
    "manual": "Introducir sin archivo",
    "review": "Revisa tu nómina",
    "help": "Comprueba las cifras y completa lo esencial que falte. Deja en blanco lo que no aparezca en tu nómina.",
    "details": "Ver o corregir detalles",
    "unread": "No hemos podido leer las cifras. Prueba con una foto más clara o un PDF, o introdúcelas a mano.",
    "save": "Confirmar y guardar",
    "retry": "Probar con otro archivo"
  },
  "pl": {
    "manual": "Wprowadź bez pliku",
    "review": "Sprawdź pasek wypłaty",
    "help": "Sprawdź kwoty i uzupełnij brakujące podstawowe dane. Pozostaw puste pola, których nie ma na pasku wypłaty.",
    "details": "Pokaż lub popraw szczegóły",
    "unread": "Nie udało się odczytać kwot. Spróbuj wyraźniejszego zdjęcia lub pliku PDF albo wpisz je ręcznie.",
    "save": "Potwierdź i zapisz",
    "retry": "Wypróbuj inny plik"
  },
  "pt": {
    "manual": "Introduzir sem ficheiro",
    "review": "Revê o teu recibo",
    "help": "Confere os valores e completa os dados essenciais em falta. Deixa em branco o que não constar do recibo.",
    "details": "Ver ou corrigir detalhes",
    "unread": "Não conseguimos ler os valores. Tenta uma foto mais nítida ou um PDF, ou introduz os dados manualmente.",
    "save": "Confirmar e guardar",
    "retry": "Experimentar outro ficheiro"
  },
  "lt": {
    "manual": "Įvesti be failo",
    "review": "Peržiūrėkite atlyginimo lapelį",
    "help": "Patikrinkite sumas ir užpildykite trūkstamus būtinus duomenis. Lapelyje nenurodytus laukus palikite tuščius.",
    "details": "Peržiūrėti arba taisyti informaciją",
    "unread": "Nepavyko nuskaityti sumų. Bandykite aiškesnę nuotrauką ar PDF arba įveskite jas ranka.",
    "save": "Patvirtinti ir išsaugoti",
    "retry": "Bandyti kitą failą"
  },
  "ro": {
    "manual": "Introdu fără fișier",
    "review": "Verifică fluturașul de salariu",
    "help": "Verifică sumele și completează datele esențiale lipsă. Lasă necompletate câmpurile care nu apar în document.",
    "details": "Vezi sau corectează detaliile",
    "unread": "Nu am putut citi sumele. Încearcă o fotografie mai clară sau un PDF ori introdu datele manual.",
    "save": "Confirmă și salvează",
    "retry": "Încearcă alt fișier"
  },
  "ru": {
    "manual": "Ввести без файла",
    "review": "Проверьте расчётный листок",
    "help": "Проверьте суммы и заполните недостающие основные данные. Оставьте пустыми поля, которых нет в документе.",
    "details": "Посмотреть или исправить детали",
    "unread": "Не удалось прочитать суммы. Попробуйте более чёткое фото или PDF либо введите данные вручную.",
    "save": "Подтвердить и сохранить",
    "retry": "Попробовать другой файл"
  },
  "de": {
    "manual": "Ohne Datei eingeben",
    "review": "Lohnabrechnung prüfen",
    "help": "Prüfe die Beträge und ergänze fehlende wesentliche Angaben. Lasse nicht aufgeführte Angaben leer.",
    "details": "Details ansehen oder korrigieren",
    "unread": "Die Beträge konnten nicht gelesen werden. Versuche ein schärferes Foto oder eine PDF oder gib sie manuell ein.",
    "save": "Bestätigen und speichern",
    "retry": "Andere Datei versuchen"
  }
};

const passwordCopy: Record<Locale, [string, string, string]> = {
es: ["Este PDF necesita contraseña. Se usa solo para leerlo; no se guarda.", "Contraseña incorrecta. Vuelve a intentarlo.", "Abrir PDF"],
en: ["This PDF needs a password. It is used only to read it and is not saved.", "Incorrect password. Try again.", "Open PDF"],
de: ["PDF-Passwort erforderlich. Es wird nicht gespeichert.", "Falsches Passwort.", "PDF öffnen"],
pl: ["PDF wymaga hasła. Nie jest zapisywane.", "Nieprawidłowe hasło.", "Otwórz PDF"],
pt: ["O PDF requer uma palavra-passe. Não é guardada.", "Palavra-passe incorreta.", "Abrir PDF"],
lt: ["PDF reikia slaptažodžio. Jis neišsaugomas.", "Neteisingas slaptažodis.", "Atidaryti PDF"],
ro: ["PDF-ul necesită o parolă. Nu este salvată.", "Parolă incorectă.", "Deschide PDF"],
ru: ["Для PDF нужен пароль. Он не сохраняется.", "Неверный пароль.", "Открыть PDF"],
};
const optionalLabel: Record<Locale, string> = { es: "opcional", en: "optional", de: "optional", pl: "opcjonalnie", pt: "opcional", lt: "neprivaloma", ro: "opțional", ru: "необязательно" };

const DRAFT_KEY = "truckpay.payslip-draft";

export function PayslipForm({ defaultEmployer = "", defaultPayFrequency = "unknown", onPrepared, onDraftRead, autoPrepare = false, onProcessed, onNeedsDetails, employmentStartFields, initialFile, onImportFiles, maxImports, onReadingChange }: { defaultPayFrequency?: PayFrequency; onReadingChange?: (reading: boolean) => void; initialFile?: File; onImportFiles?: (files: File[]) => void; maxImports?: number; employmentStartFields?: React.ReactNode; onNeedsDetails?: (needed: boolean) => void; defaultEmployer?: string; autoPrepare?: boolean; onProcessed?: (message: string | null) => void; onPrepared?: (payload: Record<string, unknown>) => void; onDraftRead?: (draft: { employerName: string } | null) => void }) {
  const router = useRouter();
  const { t, locale } = useT();
  const copy = formCopy[locale];
  const tr = useUiCopy();
  const [employmentReady, setEmploymentReady] = useState(false);
  const [amountReceipt, setAmountReceipt] = useState<string | null>(null);
  const [canEditAmounts, setCanEditAmounts] = useState(false);
  const [missingEssentials, setMissingEssentials] = useState<{ company: boolean; date: boolean; frequency: boolean } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [unreadFile, setUnreadFile] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({ ...emptyForm, employerName: defaultEmployer }));
  const [allowances, setAllowances] = useState<Line[]>(() => [emptyLine("allowance-seed")]);
  const [deductions, setDeductions] = useState<Line[]>(() => [emptyLine("deduction-seed")]);

  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lockedFile, setLockedFile] = useState<File | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<"required" | "incorrect" | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoPreviewRef = useRef<string | null>(null);
  const fileReadLock = useRef(false);
  const lastAttemptFile = useRef<File | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const employerOverride = useRef<string | undefined>(undefined);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

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
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Storage may be disabled. */ }
    return () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    };
  }, []);



  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (key === "employerName") employerOverride.current = String(value);
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "employerName" && showReview) onDraftRead?.({ employerName: String(value) });
  }

  function applyExtracted(
    fields: Record<string, string | number | null>,
    extractedDeductions: { rawLabel: string; amount: number }[],
    extractedAllowances: { rawLabel: string; amount: number }[],
  ) {
    const draft = draftFromExtraction(fields, extractedDeductions, extractedAllowances, defaultPayFrequency);
    draft.form.employerName = preferredEmployer(employerOverride.current ?? defaultEmployer, draft.form.employerName);
    setForm(draft.form);
    setDeductions(draft.deductions);
    setAllowances(draft.allowances);
    return draft;
  }

  async function onPickFile(file: File | undefined, password?: string) {
    if (!file || fileReadLock.current || pending) return;
    lastAttemptFile.current = file;
    setReadFailed(false);
    setSessionExpired(false);
    let processingNotice: string | null = null;
    fileReadLock.current = true;
    setReadingFile(true);
    onReadingChange?.(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      if (password !== undefined) body.append("password", password);
      const res = await fetch("/api/payslips/extract", {
        method: "POST",
        credentials: "same-origin",
        body,
        signal: AbortSignal.timeout(45000),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        kind?: string;
        amountReceipt?: string;
        canEditAmounts?: boolean;
        passwordStatus?: "required" | "incorrect";
        fileLabel?: string;
        message?: string;
        filledKeys?: string[];
        fields?: Record<string, string | number | null>;
        deductions?: { rawLabel: string; amount: number }[];
        allowances?: { rawLabel: string; amount: number }[];
      };
      if (!res.ok) {
        setSessionExpired(res.status === 401);
        throw new Error(extractionError(res.status, data.error, locale === "es"));
      }
      if (data.kind === "unsupported") throw new Error(extractionError(200, data.message, locale === "es"));
      if (data.passwordStatus) {
        processingNotice = locale === "es" ? "Este PDF necesita contraseña. Introdúcela en el apartado de carga para poder contarlo." : "This PDF needs a password. Enter it in the upload section before it can count.";
        setLockedFile(file); setPasswordStatus(data.passwordStatus);
        return;
      }
      if (typeof data.fields?.netPay !== "number" || !Number.isFinite(data.fields.netPay) || !data.amountReceipt) {
        throw new Error(locale === "es" ? "No se pudo leer el neto. Usa el PDF original con texto seleccionable; una foto o un PDF escaneado puede no ser legible." : "Net pay could not be read. Use the original PDF with selectable text; a photo or scanned PDF may not be readable.");
      }
      // Commit the replacement only after a usable extraction. Failed attempts preserve the draft and its receipt.
      onDraftRead?.(null);
      setMissingEssentials(null); onNeedsDetails?.(false);
      setFileNote(null); setUnreadFile(false);
      setLockedFile(null); setPasswordStatus(null);
      replacePhotoPreview(file);
      setFileLabel(data.fileLabel ?? file.name);
      const fieldCount = data.filledKeys?.length ?? 0;
      setFileNote(fieldCount ? null : data.canEditAmounts ? copy.unread : locale === "es" ? "No se han podido leer los importes. Prueba con una copia más clara del documento." : "The amounts could not be read. Try a clearer copy of the document.");
      setUnreadFile(fieldCount === 0);
      if (!fieldCount) processingNotice = locale === "es" ? "No se han podido leer los datos. Este documento todavía no cuenta; prueba otra copia." : "No data could be read. This document does not count yet; try another copy.";
      setShowReview(fieldCount > 0 && !autoPrepare);
      setAmountReceipt(data.amountReceipt ?? null);
      setCanEditAmounts(data.canEditAmounts === true);
      const draft = applyExtracted(data.fields ?? {}, data.deductions ?? [], data.allowances ?? []);
      if (autoPrepare && onPrepared && fieldCount > 0) {
        const employerName = draft.form.employerName;
        if (draft.form.netPay === "" || !Number.isFinite(Number(draft.form.netPay)) || !data.amountReceipt) {
          throw new Error(locale === "es" ? "No se ha podido leer el neto. Prueba una copia más clara del PDF." : "Net pay could not be read. Try a clearer copy of the PDF.");
        }
        const missing = { company: !employerName.trim(), date: !draft.form.paymentDate, frequency: !["weekly", "fortnightly", "monthly"].includes(draft.form.payFrequency) };
        passwordRef.current?.blur();
        fileInputRef.current?.blur();
        if (missing.company || missing.date || missing.frequency) {
          setMissingEssentials(missing);
          onNeedsDetails?.(true);
          processingNotice = locale === "es" ? "Neto leído. Completa solo los datos que faltan en el apartado de carga para añadir esta nómina." : "Net pay read. Complete only the missing fields in the upload section to add this payslip.";
        } else {
          onPrepared({ ...draft.form, employerName, amountReceipt: data.amountReceipt, deductions: packed(draft.deductions), allowances: packed(draft.allowances) });
        }
      }
      if (!autoPrepare && fieldCount > 0) onDraftRead?.({ employerName: draft.form.employerName });
    } catch (err) {
      processingNotice = err instanceof Error && err.name !== "TypeError" && err.name !== "TimeoutError" ? err.message : extractionError(0, undefined, locale === "es");
      processingNotice += locale === "es" ? " Lo que ya tenías preparado se conserva mientras sigas en esta página." : "Your previously prepared data is kept while you stay on this page.";
      setError(processingNotice);
      setReadFailed(true);
    } finally {
      if (passwordRef.current) passwordRef.current.value = "";
      fileReadLock.current = false;
      setReadingFile(false);
      onReadingChange?.(false);
      onProcessed?.(processingNotice);
    }
  }

  const initialFileRead = useRef<File | null>(null);
  function pickFiles(files: ArrayLike<File>) {
    if (fileReadLock.current || pending) return;
    let selected: File[];
    try {
      selected = filesForImport(files, onImportFiles ? (maxImports ?? 3) : 20);
    } catch (err) {
      const limit = err instanceof Error ? err.message : "20";
      setError(locale === "es" ? `Elige como máximo ${limit} archivos cada vez. No se ha descartado ningún archivo de la cola anterior.` : `Choose at most ${limit} files at a time. No files from the previous queue were discarded.`);
      return;
    }
    if (!selected.length) return;
    setSavedNotice(null);
    if (onImportFiles) {
      onImportFiles(selected);
    } else {
      setQueuedFiles(selected.slice(1));
      void onPickFile(selected[0]);
    }
  }
  const pickFilesRef = useRef(pickFiles);
  const onPickFileRef = useRef(onPickFile);
  useEffect(() => {
    onPickFileRef.current = onPickFile;
    pickFilesRef.current = pickFiles;
  });

  useEffect(() => {
    if (!initialFile || initialFileRead.current === initialFile) return;
    initialFileRead.current = initialFile;
    void onPickFileRef.current(initialFile);
  }, [initialFile]);

  useEffect(() => {
    const el = fileInputRef.current;
    if (!el) return;
    const onChange = () => {
      if (el.files) pickFilesRef.current(el.files);
      el.value = "";
    };
    el.addEventListener("change", onChange);
    return () => el.removeEventListener("change", onChange);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if ((!showReview && !missingEssentials) || fileReadLock.current || pending) return;
    if (onPrepared) {
      if (!form.employerName.trim() || !form.paymentDate || !["weekly", "fortnightly", "monthly"].includes(form.payFrequency)) return;
      onPrepared({ ...form, amountReceipt, employerName: form.employerName || null, allowances: packed(allowances), deductions: packed(deductions) });
      return;
    }
    setPending(true);
    setReadFailed(false);
    setError(null);
    try {
      const res = await fetch("/api/payslips", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amountReceipt,
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
      window.dispatchEvent(new Event("truckpay-payslips-changed"));
      if (queuedFiles.length) {
        const [nextFile, ...remaining] = queuedFiles;
        setQueuedFiles(remaining);
        setSavedNotice(locale === "es" ? "Nómina guardada. Revisa la siguiente antes de guardarla." : "Payslip saved. Review the next one before saving it.");
        setShowReview(false);
        setAmountReceipt(null);
        setFileLabel(nextFile.name);
        setEmploymentReady(false);
        setForm({ ...emptyForm });
        setDeductions([emptyLine()]);
        setAllowances([emptyLine()]);
        await onPickFile(nextFile);
        return;
      }
      const next = "/payslips";
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
      {savedNotice && <p role="status" className="rounded-xl bg-accent/10 p-4 text-sm">{savedNotice}</p>}
      {queuedFiles.length > 0 && <p role="status" className="text-sm">{locale === "es" ? `${queuedFiles.length} nóminas pendientes después de esta. Se revisan y guardan por separado.` : `${queuedFiles.length} payslips queued after this one. Review and save each separately.`}</p>}
      {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p>{tr(error)}</p>
        {sessionExpired && <a href="/account" target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-11 items-center underline">{locale === "es" ? "Iniciar sesión en otra pestaña y volver aquí" : "Sign in in another tab, then return here"}</a>}
        {readFailed && <Button type="button" variant="outline" className="mt-3 min-h-11" disabled={readingFile || pending} onClick={() => void onPickFile(lastAttemptFile.current ?? undefined)}>{locale === "es" ? "Reintentar lectura" : "Retry reading"}</Button>}
      </div>}
      {missingEssentials && <section className="space-y-4 rounded-xl border border-accent bg-accent/10 p-5">
        <h2 className="font-heading text-xl font-semibold">{locale === "es" ? "Solo falta completar esto" : "Just these details are missing"}</h2>
        <p className="text-sm">{locale === "es" ? "El neto ya se ha leído. Copia los datos que falten de esta nómina; la fecha de pago es distinta del inicio en la empresa." : "Net pay has been read. Copy missing details from this payslip; payment date is different from your employment start."}</p>
        {missingEssentials.company && <label className="block text-sm">{locale === "es" ? "Nombre de empresa" : "Employer name"}<Input className="mt-1 text-base" value={form.employerName} required onChange={event=>set("employerName",event.target.value)} /></label>}
        {missingEssentials.date && <label className="block text-sm">{locale === "es" ? "Fecha de pago de esta nómina" : "Payment date on this payslip"}<Input className="mt-1 text-base" type="date" value={form.paymentDate} required onChange={event=>set("paymentDate",event.target.value)} /></label>}
        {missingEssentials.frequency && <label className="block text-sm">{locale === "es" ? "Frecuencia de pago" : "Pay frequency"}<select className="mt-1 block min-h-11 w-full rounded-lg border border-border bg-background p-2 text-base" value={form.payFrequency} onChange={event=>set("payFrequency",event.target.value as FormState["payFrequency"])}><option value="unknown">{locale === "es" ? "Selecciona" : "Choose"}</option><option value="weekly">{locale === "es" ? "Semanal" : "Weekly"}</option><option value="fortnightly">{locale === "es" ? "Cada dos semanas" : "Every two weeks"}</option><option value="monthly">{locale === "es" ? "Mensual" : "Monthly"}</option></select></label>}
        {employmentStartFields}
        <Button type="submit" disabled={readingFile || pending || !form.employerName.trim() || !form.paymentDate || !["weekly", "fortnightly", "monthly"].includes(form.payFrequency)} className="bg-accent text-accent-foreground hover:bg-accent/90">{locale === "es" ? "Añadir al contador" : "Add to the counter"}</Button>
      </section>}
      <GmailImport onImport={async file => pickFiles([file])} onImportFiles={pickFiles} maxSelections={maxImports ?? 20} disabled={readingFile || pending} />
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
          pickFiles(event.dataTransfer.files);
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
          <span className="mt-2 block">{locale === "es" ? "Puedes seleccionar varias nóminas juntas. Cada archivo conserva sus propios importes y fechas." : "You can select several payslips together. Each file keeps its own amounts and dates."}</span>
          <span className="mt-2 block">{locale === "es" ? "Puedes elegir el PDF desde Archivos del móvil. Si no está protegido, se leerá directamente; solo pediremos contraseña si hace falta." : "Choose a PDF from Files on your phone. Unprotected PDFs are read directly; a password is only requested when needed."}</span>
        </p>
        <label className="mt-4 inline-flex cursor-pointer flex-col items-center gap-2 rounded-lg focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <span className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
            {readingFile ? t("form.reading") : unreadFile ? copy.retry : t("form.chooseFile")}
          </span>
          <input
            ref={fileInputRef}
            id="payslip-file"
            name="payslip-file"
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
            disabled={readingFile || pending}
            className="sr-only"
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

      {lockedFile && passwordStatus && <div className="rounded-xl border border-accent bg-accent/10 p-5 space-y-3">
        <p className="break-words text-sm">{locale === "es" ? "PDF pendiente de abrir: " : "PDF waiting to be opened: "}{lockedFile.name}</p>
        <label htmlFor="pdf-password" className="block text-sm font-medium">{passwordCopy[locale][0]}</label>
        {passwordStatus === "incorrect" && <p role="alert" className="text-sm text-destructive">{passwordCopy[locale][1]}</p>}
        <Input ref={passwordRef} id="pdf-password" type="password" autoComplete="off" disabled={readingFile} onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (event.currentTarget.value) void onPickFile(lockedFile, event.currentTarget.value);
          }
        }} />
        <Button type="button" disabled={readingFile} onClick={() => {
          if (passwordRef.current?.value) void onPickFile(lockedFile, passwordRef.current.value);
          else passwordRef.current?.focus();
        }}>{readingFile ? t("form.reading") : passwordCopy[locale][2]}</Button>
      </div>}


      {showReview && <fieldset disabled={readingFile || pending} className="space-y-6 min-w-0">
      <Section title={copy.review}>
        <p className="mb-3 text-sm">{canEditAmounts ? "Edición temporal de prueba: los importes modificados se guardan como manuales, conservando los originales, y no cuentan como verificados." : "Importes leídos del documento. Si hay un error, vuelve a subir el archivo."}</p>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">{copy.help}</p>
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
          <Field label={`${t("form.periodStart")} (${optionalLabel[locale]})`}>
            <Input
              id="payPeriodStart"
              name="payPeriodStart"
              type="date"
              value={form.payPeriodStart}
              onChange={(event) => set("payPeriodStart", event.target.value)}
            />
          </Field>
          <Field label={`${t("form.periodEnd")} (${optionalLabel[locale]})`}>
            <Input
              id="payPeriodEnd"
              name="payPeriodEnd"
              type="date"
              value={form.payPeriodEnd}
              onChange={(event) => set("payPeriodEnd", event.target.value)}
            />
          </Field>
          <Field label={t("form.gross")}>
            <Input id="grossPay" name="grossPay" inputMode="decimal" readOnly={!canEditAmounts} value={form.grossPay} onChange={(event) => set("grossPay", event.target.value)} />
          </Field>
          <Field label={t("form.net")}>
            <Input id="netPay" name="netPay" inputMode="decimal" readOnly={!canEditAmounts} value={form.netPay} onChange={(event) => set("netPay", event.target.value)} />
          </Field>
        </div>
      </Section>

      {!onPrepared && <EmploymentStartField employerName={form.employerName} asOf={form.payPeriodEnd || form.paymentDate} onReady={setEmploymentReady} />}
      <details className="rounded-xl border border-border p-4" onInvalidCapture={event => { event.currentTarget.open = true; }}>
        <summary className="cursor-pointer text-sm font-semibold">{copy.details}</summary>
        <div className="mt-5 space-y-6">
      <Section title={t("form.whoWhen")}>
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Input id="basicRate" name="basicRate" inputMode="decimal" readOnly={!canEditAmounts} value={form.basicRate} onChange={(event) => set("basicRate", event.target.value)} />
          </Field>
          <Field label={t("form.basicPay")}>
            <Input id="basicPay" name="basicPay" inputMode="decimal" readOnly={!canEditAmounts} value={form.basicPay} onChange={(event) => set("basicPay", event.target.value)} />
          </Field>
          <Field label={t("form.overtimeHours")}>
            <Input inputMode="decimal" value={form.overtimeHours} onChange={(event) => set("overtimeHours", event.target.value)} />
          </Field>
          <Field label={t("form.overtimeRate")}>
            <Input inputMode="decimal" readOnly={!canEditAmounts} value={form.overtimeRate} onChange={(event) => set("overtimeRate", event.target.value)} />
          </Field>
          <Field label={t("form.overtimePay")}>
            <Input inputMode="decimal" readOnly={!canEditAmounts} value={form.overtimePay} onChange={(event) => set("overtimePay", event.target.value)} />
          </Field>
          <Field label={t("form.holidayPay")}>
            <Input id="holidayPay" name="holidayPay" inputMode="decimal" readOnly={!canEditAmounts} value={form.holidayPay} onChange={(event) => set("holidayPay", event.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title={t("form.totals")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("form.cumulativeGross")}>
            <Input inputMode="decimal" readOnly={!canEditAmounts} value={form.cumulativeGross} onChange={(event) => set("cumulativeGross", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativeTax")}>
            <Input inputMode="decimal" readOnly={!canEditAmounts} value={form.cumulativeTax} onChange={(event) => set("cumulativeTax", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativePrsi")}>
            <Input inputMode="decimal" readOnly={!canEditAmounts} value={form.cumulativePrsi} onChange={(event) => set("cumulativePrsi", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativeUsc")}>
            <Input inputMode="decimal" readOnly={!canEditAmounts} value={form.cumulativeUsc} onChange={(event) => set("cumulativeUsc", event.target.value)} />
          </Field>
          <Field label={t("form.cumulativePension")}>
            <Input inputMode="decimal" readOnly={!canEditAmounts} value={form.cumulativePension} onChange={(event) => set("cumulativePension", event.target.value)} />
          </Field>
          <Field label={t("form.ytdWeeks")}>
            <Input inputMode="decimal" value={form.totalInsurableWeeks} onChange={(event) => set("totalInsurableWeeks", event.target.value)} />
          </Field>
        </div>
      </Section>

      <Section
        title={t("form.allowances")}
        action={
          <Button type="button" disabled={!canEditAmounts} id="add-allowance" size="sm" variant="outline" onClick={() => setAllowances((rows) => [...rows, emptyLine()])}>
            {t("form.addLine")}
          </Button>
        }
      >
        <LineTable
          rows={allowances}
          onChange={setAllowances} readOnly={!canEditAmounts}
          labelPlaceholder={t("form.allowancePlaceholder")}
          namePrefix="allowance"
          removeLabel={t("form.remove")}
        />
      </Section>

      <Section
        title={t("form.deductions")}
        action={
          <Button type="button" disabled={!canEditAmounts} id="add-deduction" size="sm" variant="outline" onClick={() => setDeductions((rows) => [...rows, emptyLine()])}>
            {t("form.addLine")}
          </Button>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">{t("form.deductionHelp")}</p>
        <LineTable
          rows={deductions}
          onChange={setDeductions} readOnly={!canEditAmounts}
          labelPlaceholder={t("form.deductionPlaceholder")}
          namePrefix="deduction"
          removeLabel={t("form.remove")}
        />
      </Section>

        </div>
      </details>
      </fieldset>}
      {showReview && !amountReceipt && <p role="status" className="text-sm">{locale === "es" ? "Vuelve a seleccionar el documento para comprobar los importes antes de guardar." : "Select the document again to check its amounts before saving."}</p>}
      {showReview && <Button type="submit" disabled={pending || readingFile || !amountReceipt || (!onPrepared && !employmentReady)} className="bg-accent text-accent-foreground hover:bg-accent/90">
        {pending ? t("form.checking") : onPrepared ? (locale === "es" ? "Revisado · continuar" : "Reviewed · continue") : copy.save}
      </Button>}
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
      <label className="text-sm font-medium" htmlFor={isValidElement<{ id?: string }>(children) ? children.props.id : undefined}>{label}</label>
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
  readOnly = false,
}: {
  rows: Line[];
  onChange: (rows: Line[]) => void;
  labelPlaceholder: string;
  namePrefix: string;
  removeLabel: string;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input
            readOnly={readOnly} name={`${namePrefix}-label-${index}`}
            value={row.rawLabel}
            placeholder={labelPlaceholder}
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...row, rawLabel: event.target.value };
              onChange(next);
            }}
          />
          <Input
            readOnly={readOnly} name={`${namePrefix}-amount-${index}`}
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
            disabled={readOnly}
            onClick={() => onChange(rows.filter((item) => item.key !== row.key).length ? rows.filter((item) => item.key !== row.key) : [emptyLine()])}
          >
            {removeLabel}
          </Button>
        </div>
      ))}
    </div>
  );
}
