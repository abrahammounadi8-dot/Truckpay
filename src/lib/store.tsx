"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { DriverReport } from "@/lib/types";
import type { ReportInput } from "@/lib/report-input";

const STORAGE_KEY = "truckpay.reports";
const COMPARE_KEY = "truckpay.compare";
const EVENT = "truckpay-store";

type Store = {
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

let reportsCache: DriverReport[] = [];
let compareCache: string[] = [];

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
  reportsCache = readJson<unknown[]>(STORAGE_KEY, []).filter(isLiveReport);
  compareCache = readJson<string[]>(COMPARE_KEY, []).slice(0, 3);
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

function getReports() {
  return reportsCache;
}

function getCompare() {
  return compareCache;
}

function getServerEmptyReports(): DriverReport[] {
  return [];
}

function getServerEmptyCompare(): string[] {
  return [];
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

  const value = useMemo(
    () => ({ reports, compareSlugs, submitReport, toggleCompare, clearCompare, ready }),
    [reports, compareSlugs, submitReport, toggleCompare, clearCompare, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}

if (typeof window !== "undefined") {
  loadCaches();
}
