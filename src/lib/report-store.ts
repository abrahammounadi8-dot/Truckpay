import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DriverReport } from "@/lib/types";

const MAX_REPORTS = 400;

type GlobalStore = {
  truckpayReports?: DriverReport[];
};

function storePath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "truckpay-reports.json");
  }
  return path.join(process.cwd(), "data", "reports.json");
}

async function readFromDisk(): Promise<DriverReport[]> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as DriverReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeToDisk(reports: DriverReport[]) {
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(reports, null, 2)}\n`, "utf8");
}

export async function listReports(companySlug?: string): Promise<DriverReport[]> {
  const globalStore = globalThis as GlobalStore;
  if (!globalStore.truckpayReports) {
    globalStore.truckpayReports = await readFromDisk();
  }
  const reports = globalStore.truckpayReports;
  if (!companySlug) return reports;
  return reports.filter((report) => report.companySlug === companySlug);
}

export async function saveReport(report: DriverReport): Promise<DriverReport> {
  const current = await listReports();
  const next = [report, ...current].slice(0, MAX_REPORTS);
  (globalThis as GlobalStore).truckpayReports = next;
  await writeToDisk(next);
  return report;
}
