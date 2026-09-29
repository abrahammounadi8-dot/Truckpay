"use client";
import type { CompanyPayStats } from "./payroll/company-stats";
import { companyNameKey } from "./directory-companies";


import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { reportCompanies } from "@/lib/report-companies";
import type { Company, DriverReport } from "@/lib/types";
import type { ReportInput } from "@/lib/report-input";

const STORAGE_KEY = "truckpay.reports";
const COMPARE_KEY = "truckpay.compare";
const EVENT = "truckpay-store";

type Store = {
  payStats: Record<string, CompanyPayStats>;
  companies: Company[];
  reports: DriverReport[];
  compareSlugs: string[];
  submitReport: (input: ReportInput) => Promise<DriverReport>;
  toggleCompare: (slug: string) => void;
  clearCompare: () => void;
  ready: boolean;
};

const StoreContext = createContext<Store | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const EMPTY_REPORTS: DriverReport[] = [];
const EMPTY_COMPARE: string[] = [];
let reportsCache: DriverReport[] = EMPTY_REPORTS;
let compareCache: string[] = EMPTY_COMPARE;

function isLiveReport(value: unknown): value is DriverReport {
  if (!value || typeof value !== "object") return false;
  const report = value as DriverReport;
  return (
    typeof report.id === "string" &&
    typeof report.companySlug === "string" &&
    typeof report.weeklyPay === "number" &&
    typeof report.hoursPerWeek === "number" &&
    typeof report.submittedAt === "string" &&
    typeof report.payType === "string" &&
    typeof report.equipment === "string" &&
    typeof report.operation === "string"
  );
}

function loadCaches() {
  const reports = readJson<unknown[]>(STORAGE_KEY, []).filter(isLiveReport);
  reportsCache = reports.length ? reports : EMPTY_REPORTS;
  const compare = readJson<string[]>(COMPARE_KEY, []).slice(0, 3);
  compareCache = compare.length ? compare : EMPTY_COMPARE;
}

function subscribe(callback: () => void) {
  const onChange = () => {
    loadCaches();
    callback();
  };
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function cacheReports(reports: DriverReport[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  loadCaches();
  emit();
}

let clientCachesLoaded = false;

function ensureClientCaches() {
  if (clientCachesLoaded || typeof window === "undefined") return;
  loadCaches();
  clientCachesLoaded = true;
}

function getReports() {
  ensureClientCaches();
  return reportsCache;
}

function getCompare() {
  ensureClientCaches();
  return compareCache;
}

function getServerEmptyReports(): DriverReport[] {
  return EMPTY_REPORTS;
}

function getServerEmptyCompare(): string[] {
  return EMPTY_COMPARE;
}

function mergeReports(server: DriverReport[], local: DriverReport[]): DriverReport[] {
  const byId = new Map<string, DriverReport>();
  for (const report of [...local, ...server].filter(isLiveReport)) {
    byId.set(report.id, report);
  }
  return [...byId.values()].sort(
    (a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id.localeCompare(a.id),
  );
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [payStats, setPayStats] = useState<Record<string, CompanyPayStats>>({});
  const [registeredCompanies, setRegisteredCompanies] = useState<Company[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = () => { fetch("/api/companies", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then((data: { companies: Company[]; payStats?: Record<string, CompanyPayStats> }) => { if (!cancelled) { setRegisteredCompanies(data.companies); setPayStats(data.payStats ?? {}); } }).catch(() => {}); };
    load();
    window.addEventListener("truckpay-payslips-changed", load);
    window.addEventListener("truckpay-employment-changed", load);
    window.addEventListener("focus", load);
    return () => { cancelled = true; window.removeEventListener("truckpay-payslips-changed", load); window.removeEventListener("truckpay-employment-changed", load); window.removeEventListener("focus", load); };
  }, []);
  const reports = useSyncExternalStore(subscribe, getReports, getServerEmptyReports);
  const compareSlugs = useSyncExternalStore(subscribe, getCompare, getServerEmptyCompare);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("fetch failed"))))
      .then((payload: { reports?: DriverReport[] }) => {
        if (cancelled) return;
        const server = Array.isArray(payload.reports) ? payload.reports : [];
        cacheReports(mergeReports(server, readJson<DriverReport[]>(STORAGE_KEY, [])));
      })
      .catch(() => {
        /* Keep whatever is already on this device. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submitReport = useCallback(async (input: ReportInput) => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = (await res.json()) as { report?: DriverReport; error?: string };
    if (!res.ok || !payload.report) {
      throw new Error(payload.error ?? "Could not file the wage slip.");
    }
    cacheReports(mergeReports([payload.report], readJson<DriverReport[]>(STORAGE_KEY, [])));
    return payload.report;
  }, []);

  const toggleCompare = useCallback((slug: string) => {
    const current = readJson<string[]>(COMPARE_KEY, []);
    const exists = current.includes(slug);
    const next = exists
      ? current.filter((item) => item !== slug)
      : current.length >= 3
        ? [...current.slice(1), slug]
        : [...current, slug];
    window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
    loadCaches();
    emit();
  }, []);

  const clearCompare = useCallback(() => {
    window.localStorage.setItem(COMPARE_KEY, JSON.stringify([]));
    loadCaches();
    emit();
  }, []);

  const companies = useMemo(() => {
    const merged = new Map<string, Company>();
    for (const company of [...registeredCompanies, ...reportCompanies(reports)]) merged.set(companyNameKey(company.name), company);
    return [...merged.values()];
  }, [reports, registeredCompanies]);

  const value = useMemo(
    () => ({ companies, payStats, reports, compareSlugs, submitReport, toggleCompare, clearCompare, ready }),
    [companies, payStats, reports, compareSlugs, submitReport, toggleCompare, clearCompare, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
