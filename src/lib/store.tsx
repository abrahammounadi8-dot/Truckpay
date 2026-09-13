"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { DriverReport } from "@/lib/types";

const STORAGE_KEY = "truckpay.reports";
const COMPARE_KEY = "truckpay.compare";
const EVENT = "truckpay-store";

type Store = {
  reports: DriverReport[];
  compareSlugs: string[];
  addReport: (report: DriverReport) => void;
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

function loadCaches() {
  reportsCache = readJson<DriverReport[]>(STORAGE_KEY, []);
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

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const reports = useSyncExternalStore(subscribe, getReports, getServerEmptyReports);
  const compareSlugs = useSyncExternalStore(subscribe, getCompare, getServerEmptyCompare);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const addReport = useCallback((report: DriverReport) => {
    const next = [report, ...readJson<DriverReport[]>(STORAGE_KEY, [])];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    loadCaches();
    emit();
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
    () => ({ reports, compareSlugs, addReport, toggleCompare, clearCompare, ready }),
    [reports, compareSlugs, addReport, toggleCompare, clearCompare, ready],
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
