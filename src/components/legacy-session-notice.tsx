import { cookies } from "next/headers";

/** Old unsigned sessions cannot securely prove ownership of saved records. */
export async function LegacySessionNotice() {
  const jar = await cookies();
  if (!jar.has("tp_uid")) return null;
  return (
    <aside role="status" className="mx-auto mt-6 max-w-3xl rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm">
      <p lang="en">This browser has a session from an earlier version. Its payslips cannot be linked to a new account automatically. Keep your original payslip files; account migration is pending. Use synthetic documents only during this test period.</p>
      <p lang="es" className="mt-2">Este navegador tiene una sesión de una versión anterior. Sus nóminas no se pueden vincular automáticamente a una cuenta nueva. Conserva los documentos originales; la migración está pendiente. Usa solo documentos ficticios durante las pruebas.</p>
    </aside>
  );
}
