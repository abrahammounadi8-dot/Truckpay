export type DocumentKind = "payslip" | "profile";
export interface Queryable {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
}
export class DuplicatePayslipError extends Error {
  constructor() { super("This payslip has already been saved."); }
}
/** Preserve the complete domain payload, including nulls and provenance. */
export class DocumentRepository {
  constructor(private readonly db: Queryable) {}
  async list<T>(kind: DocumentKind, userId?: string): Promise<T[]> {
    const result = userId === undefined
      ? await this.db.query("SELECT payload FROM truckpay_documents WHERE kind = $1 ORDER BY id", [kind])
      : await this.db.query("SELECT payload FROM truckpay_documents WHERE kind = $1 AND user_id = $2 ORDER BY id", [kind, userId]);
    return result.rows.map(row => row.payload as T);
  }
  async get<T>(kind: DocumentKind, userId: string, id: string): Promise<T | null> {
    const result = await this.db.query("SELECT payload FROM truckpay_documents WHERE kind = $1 AND user_id = $2 AND id = $3", [kind, userId, id]);
    return (result.rows[0]?.payload as T | undefined) ?? null;
  }
  async save<T>(kind: DocumentKind, userId: string, id: string, payload: T, hash: string | null = null): Promise<T> {
    try {
      const result = await this.db.query(
        `INSERT INTO truckpay_documents (kind, id, user_id, content_hash, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (kind, id) DO UPDATE SET
         content_hash = EXCLUDED.content_hash, payload = EXCLUDED.payload, updated_at = now()
         WHERE truckpay_documents.user_id = EXCLUDED.user_id RETURNING payload`,
        [kind, id, userId, hash, JSON.stringify(payload)]);
      if (!result.rows.length) throw new Error("Document ownership mismatch.");
      return result.rows[0].payload as T;
    } catch (error) {
      if (kind === "payslip" && (error as { code?: string }).code === "23505") throw new DuplicatePayslipError();
      throw error;
    }
  }
  async wipe(userId: string): Promise<number> {
    const result = await this.db.query("DELETE FROM truckpay_documents WHERE user_id = $1 RETURNING kind", [userId]);
    return result.rows.filter(row => row.kind === "payslip").length;
  }
  async remove(kind: DocumentKind, userId: string, id?: string): Promise<number> {
    const result = id === undefined
      ? await this.db.query("DELETE FROM truckpay_documents WHERE kind = $1 AND user_id = $2", [kind, userId])
      : await this.db.query("DELETE FROM truckpay_documents WHERE kind = $1 AND user_id = $2 AND id = $3", [kind, userId, id]);
    return result.rowCount ?? 0;
  }
}
