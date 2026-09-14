/**
 * Provenance for payroll figures.
 * SOURCE = printed on the document. DERIVED = calculated from reliable source data.
 * UNVERIFIED = missing or not yet confirmable. Never treat derived as printed.
 */

export type DataOrigin = "source" | "derived" | "unverified";

export type VerificationStatus = "source" | "derived" | "unverified" | "needs_review";

export type ProvenanceField<T> = {
  value: T | null;
  source: DataOrigin;
  derived: boolean;
  confidence: number;
  verification_status: VerificationStatus;
};

export function sourceField<T>(value: T | null | undefined): ProvenanceField<T> {
  if (value == null) return unverifiedField<T>();
  if (typeof value === "string" && value.trim() === "") return unverifiedField<T>();
  return {
    value,
    source: "source",
    derived: false,
    confidence: 1,
    verification_status: "source",
  };
}

export function derivedField<T>(value: T | null, confidence: number): ProvenanceField<T> {
  if (value == null) {
    return {
      value: null,
      source: "unverified",
      derived: true,
      confidence: 0,
      verification_status: "unverified",
    };
  }
  return {
    value,
    source: "derived",
    derived: true,
    confidence,
    verification_status: "derived",
  };
}

export function unverifiedField<T>(): ProvenanceField<T> {
  return {
    value: null,
    source: "unverified",
    derived: false,
    confidence: 0,
    verification_status: "unverified",
  };
}

export function reviewField<T>(value: T | null, confidence: number): ProvenanceField<T> {
  return {
    value,
    source: value == null ? "unverified" : "derived",
    derived: value != null,
    confidence,
    verification_status: "needs_review",
  };
}
