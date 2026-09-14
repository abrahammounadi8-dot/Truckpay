/**
 * Payslips, licence data and payroll figures are sensitive.
 * Never log PPSN, licence numbers, employee numbers, or complete payslip payloads.
 */

const IDENTIFIER_KEYS = new Set([
  "ppsn",
  "pps",
  "licence",
  "license",
  "driverlicence",
  "driverlicense",
  "drivinglicence",
  "drivinglicense",
  "licencenumber",
  "licensenumber",
  "employeenumber",
  "employeeno",
  "employeeid",
  "ninumber",
  "nationalinsurancenumber",
]);

export function rejectIdentifierFields(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  for (const key of Object.keys(body as Record<string, unknown>)) {
    const normalized = key.toLowerCase().replaceAll(/[\s_-]/g, "");
    if (!IDENTIFIER_KEYS.has(normalized)) continue;
    const value = (body as Record<string, unknown>)[key];
    if (value == null || value === "") continue;
    return "Do not send PPSN, licence, or employee numbers. TruckPay does not store them.";
  }
  return null;
}

/** Safe API error body — never includes payroll figures or identifiers. */
export function publicError(message: string): { error: string } {
  return { error: message };
}

export function redactForLog(value: unknown): { kind: string; payslipId?: string } {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return {
      kind: typeof record.kind === "string" ? record.kind : "payroll",
      payslipId: typeof record.id === "string" ? record.id : undefined,
    };
  }
  return { kind: "payroll" };
}
