import { Pool } from "pg";
type DatabaseGlobal = typeof globalThis & { truckpayDatabase?: Pool };
/** Configured databases never fall back to disk when unavailable. */
export function usesDatabase(): boolean {
  if (process.env.DATABASE_URL) return true;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") throw new Error("Truckpay requires DATABASE_URL in production.");
  return false;
}
export function database(): Pool {
  if (!usesDatabase()) throw new Error("DATABASE_URL is not configured.");
  const state = globalThis as DatabaseGlobal;
  if (!state.truckpayDatabase) {
    state.truckpayDatabase = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
    state.truckpayDatabase.on("error", () => console.error("Truckpay database connection interrupted."));
  }
  return state.truckpayDatabase;
}
