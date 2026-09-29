"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "./language-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { MailPdf } from "@/lib/gmail/client";

export function GmailImport({ onImport, disabled, onImportFiles, maxSelections = 1 }: { onImportFiles?: (files: File[]) => void; maxSelections?: number; onImport: (file: File) => Promise<void>; disabled: boolean }) {
  const { locale } = useT();
  const es = locale === "es";
  const label = (a: string, b: string) => es ? a : b;
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ configured: boolean; connected: boolean; email: string | null } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [files, setFiles] = useState<MailPdf[]>([]);
  const [search, setSearch] = useState("");
  const [usedSearch, setUsedSearch] = useState("");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function message(code?: string) {
    if (code === "RECONNECT" || code === "AUTH_REQUIRED") return label("La conexión ha caducado. Vuelve a conectar Gmail o inicia sesión en TruckPay.", "The connection expired. Reconnect Gmail or sign in to TruckPay.");
    if (code === "TOO_LARGE") return label("El PDF supera el límite de 8 MB.", "The PDF exceeds the 8 MB limit.");
    if (code === "INVALID_FILE") return label("Ese adjunto no es un PDF válido.", "That attachment is not a valid PDF.");
    return label("No se pudo completar la importación. Inténtalo de nuevo o sube el archivo desde tu dispositivo.", "Import could not be completed. Try again or upload the file from your device.");
  }
  async function loadStatus() {
    const response = await fetch("/api/gmail/status", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error(message(response.status === 401 ? "AUTH_REQUIRED" : undefined));
    setStatus(await response.json());
  }
  useEffect(() => {
    const result = new URL(window.location.href).searchParams.get("gmail");
    if (!result) return;
    // Restore the panel once after the user returns from Google authorization.
    /* eslint-disable react-hooks/set-state-in-effect */
    setOpen(true);
    if (result === "error") setError(es ? "No se ha conectado Gmail. Puedes volver a intentarlo." : "Gmail was not connected. You can try again.");
    /* eslint-enable react-hooks/set-state-in-effect */
    void loadStatus().catch(error => setError(error.message));
    const url = new URL(window.location.href); url.searchParams.delete("gmail"); window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handle authorization return only once
  }, []);
  async function browse(page?: string) {
    if (busy || disabled) return;
    searchRef.current?.blur();
    setBusy(true); setError(null);
    try {
      const term = page ? usedSearch : search;
      const params = new URLSearchParams({ search: term });
      if (page) params.set("page", page);
      const response = await fetch(`/api/gmail/messages?${params}`, { credentials: "same-origin", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "RECONNECT") setStatus(s => s && ({ ...s, connected: false }));
        throw new Error(message(data.code));
      }
      if (!page) setSelected([]);
      setFiles(previous => {
        const combined: MailPdf[] = page ? [...previous, ...data.files] : data.files;
        const seen = new Set<string>();
        return combined.filter(file => {
          const key = `${file.messageId}:${file.partId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }); setNextPage(data.nextPageToken); setUsedSearch(term); setSearched(true);
    } catch (error) { setError(error instanceof Error ? error.message : message()); }
    finally { setBusy(false); }
  }
  async function connect() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/gmail/connect", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnTo: window.location.pathname + window.location.search }) });
      const data = await response.json();
      if (!response.ok) throw new Error(message(data.code));
      window.location.assign(data.url);
    } catch (error) { setError(error instanceof Error ? error.message : message()); setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/gmail/disconnect", { method: "POST", credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(message(data.code));
      setStatus(s => s && ({ ...s, connected: false, email: null })); setFiles([]); setSelected([]); setSearched(false); setNextPage(null);
      if (!data.revoked) setError(label("La conexión local se ha cerrado. No se pudo confirmar la revocación en Google; puedes retirarla desde los permisos de tu cuenta de Google.", "The local connection is closed. Google revocation could not be confirmed; you can remove access in your Google account permissions."));
    } catch (error) { setError(error instanceof Error ? error.message : message()); }
    finally { setBusy(false); }
  }
  async function importPdf(file: MailPdf) {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/gmail/download", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: file.messageId, partId: file.partId }) });
      if (!response.ok) { const data = await response.json(); throw new Error(message(data.code)); }
      await onImport(new File([await response.blob()], file.filename, { type: "application/pdf" }));
      setOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : message()); }
    finally { setBusy(false); }
  }
  async function importSelected() {
    if (busy || disabled || !onImportFiles || !selected.length) return;
    setBusy(true); setError(null);
    try {
      const chosen = files.filter(file => selected.includes(file.messageId + ":" + file.partId));
      const downloads: File[] = [];
      for (const file of chosen.slice(0, maxSelections)) {
        const response = await fetch("/api/gmail/download", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: file.messageId, partId: file.partId }) });
        if (!response.ok) { const data = await response.json(); throw new Error(message(data.code)); }
        downloads.push(new File([await response.blob()], file.filename, { type: "application/pdf" }));
      }
      onImportFiles(downloads);
      setOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : message()); }
    finally { setBusy(false); }
  }
  return <section className="min-w-0 rounded-xl border border-border p-4" style={{ touchAction: "pan-y pinch-zoom" }}>
    <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" disabled={disabled || busy} onClick={() => {
      setOpen(!open);
      if (!open) { setBusy(true); void loadStatus().catch(error => setError(error.message)).finally(() => setBusy(false)); }
    }}>{label("Importar desde Gmail", "Import from Gmail")}</Button>
    {open && <div className="mt-4 space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">{label("Conecta Gmail y elige las nóminas que quieras importar. Google solicita acceso de lectura al correo; TruckPay busca adjuntos y no envía, modifica ni elimina mensajes. La conexión es temporal. La contraseña del PDF se pide después, si hace falta.", "Connect Gmail and choose the payslips to import. Google requests read access to email; TruckPay searches attachments and does not send, modify or delete messages. The connection is temporary. A PDF password is requested afterwards if needed.")}</p>
      {status && !status.configured && <p role="status" className="text-sm">{label("La importación desde Gmail todavía no está activada. Por ahora puedes subir el PDF desde tu dispositivo.", "Gmail import is not activated yet. For now you can upload the PDF from your device.")}</p>}
      {status?.configured && !status.connected && <Button type="button" disabled={busy || disabled} onClick={connect}>{label("Conectar Gmail", "Connect Gmail")}</Button>}
      {status?.connected && <>
        <div className="flex flex-wrap items-center gap-3"><p className="break-all text-sm">{status.email}</p><Button type="button" variant="ghost" disabled={busy || disabled} onClick={disconnect}>{label("Desconectar", "Disconnect")}</Button></div>
        <label htmlFor="gmail-search" className="block text-sm">{label("Buscar por empresa o asunto (opcional)", "Search company or subject (optional)")}</label>
        <Input ref={searchRef} className="text-base md:text-sm" enterKeyHint="search" id="gmail-search" value={search} maxLength={100} disabled={busy || disabled} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void browse(); } }} />
        <Button type="button" disabled={busy || disabled} onClick={() => void browse()}>{label("Buscar nóminas", "Find payslips")}</Button>
        {searched && !files.length && <p className="text-sm">{label("No hay PDF de hasta 8 MB en esta página de resultados. Prueba otra búsqueda o consulta la siguiente página.", "No PDFs up to 8 MB were found on this results page. Try another search or the next page.")}</p>}
        {onImportFiles && files.length > 0 && <div className="space-y-2">
          <p className="text-sm">{label("Selecciona hasta", "Select up to")} {maxSelections} {label("nóminas. Las leeremos en orden; si alguna necesita contraseña o datos, te los pediremos antes de continuar.", "payslips. We read them in order, pausing for passwords or missing details.")}</p>
          <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={busy || disabled || !selected.length} onClick={() => void importSelected()}>{label("Importar seleccionadas", "Import selected")} ({selected.length})</Button>
        </div>}
        <ul className="space-y-3">{files.map(file => <li key={`${file.messageId}:${file.partId}`} className="rounded-lg border border-border p-3">
          <p className="break-words font-medium">{file.filename}</p><p className="break-words text-sm text-muted-foreground">{file.subject}</p>
          <p className="text-xs text-muted-foreground">{new Date(file.receivedAt).toLocaleDateString(locale)}</p>
          {onImportFiles ? <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium"><input type="checkbox" className="size-5 accent-amber-500" checked={selected.includes(file.messageId + ":" + file.partId)} disabled={busy || disabled || (!selected.includes(file.messageId + ":" + file.partId) && selected.length >= maxSelections)} onChange={event => { const key = file.messageId + ":" + file.partId; setSelected(previous => event.target.checked ? [...previous, key] : previous.filter(value => value !== key)); }} />{label("Seleccionar", "Select")} {file.filename}</label> : <Button type="button" className="mt-2" disabled={busy || disabled} onClick={() => void importPdf(file)}>{label("Elegir y revisar", "Choose and review")}</Button>}
        </li>)}</ul>
        {onImportFiles && files.length > 0 && <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={busy || disabled || !selected.length} onClick={() => void importSelected()}>{label("Importar seleccionadas", "Import selected")} ({selected.length})</Button>}
        {nextPage && <Button type="button" variant="outline" disabled={busy || disabled} onClick={() => void browse(nextPage)}>{label("Más resultados", "More results")}</Button>}
      </>}
      {busy && <p role="status" className="text-sm">{label("Un momento…", "Please wait…")}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>}
  </section>;
}
