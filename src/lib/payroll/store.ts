import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Payslip } from "@/lib/payroll/types";

type Disk = { payslips: Payslip[] };

type GlobalStore = {
  truckpayPayslips?: Payslip[];
};

function storePath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "truckpay-payslips.json");
  }
  return path.join(process.cwd(), "data", "payslips.json");
}

async function readAll(): Promise<Payslip[]> {
  const globalStore = globalThis as GlobalStore;
  if (globalStore.truckpayPayslips) return globalStore.truckpayPayslips;
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Disk | Payslip[];
    const list = Array.isArray(parsed) ? parsed : (parsed.payslips ?? []);
    globalStore.truckpayPayslips = list.filter(isPayslip);
    return globalStore.truckpayPayslips;
  } catch {
    globalStore.truckpayPayslips = [];
    return [];
  }
}

async function writeAll(payslips: Payslip[]) {
  (globalThis as GlobalStore).truckpayPayslips = payslips;
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify({ payslips }, null, 2)}\n`, "utf8");
}

function isPayslip(value: unknown): value is Payslip {
  if (!value || typeof value !== "object") return false;
  const slip = value as Payslip;
  return (
    typeof slip.id === "string" &&
    typeof slip.userId === "string" &&
    typeof slip.paymentDate === "string" &&
    Array.isArray(slip.deductions)
  );
}

export async function listPayslipsForUser(userId: string): Promise<Payslip[]> {
  const all = await readAll();
  return all
    .filter((slip) => slip.userId === userId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.createdAt.localeCompare(a.createdAt));
}

export async function getPayslipForUser(userId: string, id: string): Promise<Payslip | null> {
  const list = await listPayslipsForUser(userId);
  return list.find((slip) => slip.id === id) ?? null;
}

export async function savePayslip(slip: Payslip): Promise<Payslip> {
  const all = await readAll();
  await writeAll([slip, ...all.filter((item) => item.id !== slip.id)]);
  return slip;
}

export async function deletePayslip(userId: string, id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((slip) => !(slip.userId === userId && slip.id === id));
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}

export async function deleteAllForUser(userId: string): Promise<number> {
  const all = await readAll();
  const next = all.filter((slip) => slip.userId !== userId);
  const removed = all.length - next.length;
  await writeAll(next);
  return removed;
}
