/** A driver-supplied company takes precedence over the document suggestion. */
export function preferredEmployer(driverName: string | undefined, extractedName: string): string {
  return driverName?.trim() || extractedName.trim();
}

/** Reject oversized selections instead of silently dropping selected documents. */
export function filesForImport<T>(files: ArrayLike<T>, maximum = 20): T[] {
  const selected = Array.from(files);
  if (selected.length > maximum) throw new Error(String(maximum));
  return selected;
}
