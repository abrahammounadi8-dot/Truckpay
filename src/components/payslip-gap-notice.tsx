"use client";
import { useT } from "./language-provider";
import type { Locale } from "@/lib/i18n";

const labels: Record<Locale, [string, string, string]> = {
  es: ["Semanas no consecutivas", "Períodos quincenales no consecutivos", "Meses no consecutivos"],
  en: ["Non-consecutive weeks", "Non-consecutive fortnightly periods", "Non-consecutive months"],
  de: ["Nicht aufeinanderfolgende Wochen", "Nicht aufeinanderfolgende Zweiwochenzeiträume", "Nicht aufeinanderfolgende Monate"],
  pl: ["Tygodnie nie są kolejne", "Okresy dwutygodniowe nie są kolejne", "Miesiące nie są kolejne"],
  pt: ["Semanas não consecutivas", "Períodos quinzenais não consecutivos", "Meses não consecutivos"],
  lt: ["Savaitės eina ne iš eilės", "Dviejų savaičių laikotarpiai eina ne iš eilės", "Mėnesiai eina ne iš eilės"],
  ro: ["Săptămâni neconsecutive", "Perioade de două săptămâni neconsecutive", "Luni neconsecutive"],
  ru: ["Недели идут не подряд", "Двухнедельные периоды идут не подряд", "Месяцы идут не подряд"],
};

export function PayslipGapNotice({ frequency }: { frequency: "weekly" | "fortnightly" | "monthly" }) {
  const { locale } = useT();
  return <p className="mb-2 w-fit rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
    {labels[locale][frequency === "weekly" ? 0 : frequency === "fortnightly" ? 1 : 2]}
  </p>;
}
