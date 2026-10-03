"use client";
import { createContext, useContext } from "react";
import { formatPayrollMoney, formatPayrollMoneyMaybe } from "@/lib/payroll/format";
const CurrencyContext = createContext("EUR");
export function PayrollMoneyProvider({ currency, children }: { currency: string; children: React.ReactNode }) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}
export function usePayrollMoney() {
  const currency = useContext(CurrencyContext);
  return { formatEuro: (value: number) => formatPayrollMoney(value, currency), formatEuroMaybe: (value: number | null | undefined) => formatPayrollMoneyMaybe(value, currency) };
}
