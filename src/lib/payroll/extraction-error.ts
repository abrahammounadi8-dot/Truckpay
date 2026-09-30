export function extractionError(status: number, message: string | undefined, spanish: boolean): string {
  if (status === 401) return spanish ? "Tu sesión ha caducado. Vuelve a iniciar sesión antes de reintentar." : "Your session has expired. Sign in again before retrying.";
  if (status === 413 || message?.includes("too large")) return spanish ? "El archivo supera 8 MB. Elige una copia más pequeña del PDF." : "The file exceeds 8 MB. Choose a smaller PDF.";
  if (status === 429) return spanish ? "Has hecho varias lecturas seguidas. Espera unos minutos y vuelve a intentarlo." : "Several files were read in quick succession. Wait a few minutes and retry.";
  if (message?.startsWith("Upload one payslip page")) return spanish ? "Este PDF tiene varias páginas. Sepáralas y sube una página de nómina cada vez." : message;
  if (message?.startsWith("The PDF could not be opened")) return spanish ? "No se pudo abrir el PDF. Descárgalo de nuevo y vuelve a subirlo." : message;
  if (message?.startsWith("Use a PDF")) return spanish ? "Formato no admitido. Elige un PDF o una foto JPG/PNG." : message;
  return spanish ? "No se pudo leer el archivo. Comprueba la conexión y vuelve a intentarlo; si persiste, usa el PDF original de la empresa." : "The file could not be read. Check your connection and retry; if it persists, use the employer's original PDF.";
}
