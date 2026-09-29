"use client";
import { useT } from "./language-provider";
import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, [string, string, string, string]> = {
  es: ["Completa tus primeras tres nóminas", "Añade tres nóminas consecutivas de la misma empresa: semanales, quincenales (cada dos semanas) o mensuales, sin mezclar frecuencias.", "Inicio completado. Puedes seguir añadiendo nóminas una a una cuando quieras.", "Tus nóminas están guardadas, pero aún no forman una secuencia de períodos consecutivos de la misma empresa. Revisa las fechas y la frecuencia, y añade los períodos que faltan."],
  en: ["Complete your first three payslips", "Add three consecutive payslips from the same employer: weekly, fortnightly (every two weeks) or monthly, without mixing frequencies.", "Setup complete. Keep adding payslips one at a time whenever you want.", "Your payslips are saved, but they do not yet form consecutive pay periods from the same employer. Check the dates and frequency, and add the missing periods."],
  de: ["Die ersten drei Abrechnungen", "Füge drei aufeinanderfolgende Abrechnungen mit gleichem Rhythmus desselben Arbeitgebers hinzu, um die Analyse freizuschalten.", "Einrichtung abgeschlossen. Du kannst weitere Abrechnungen einzeln hinzufügen.", "Prüfe Arbeitgeber, gleichen Zahlungsrhythmus und lückenlose Daten."],
  pl: ["Dodaj pierwsze trzy paski wypłaty", "Dodaj trzy kolejne paski o tej samej częstotliwości od tego samego pracodawcy, aby odblokować analizę.", "Gotowe. Możesz dalej dodawać paski pojedynczo.", "Sprawdź pracodawcę, częstotliwość wypłat i ciągłość dat."],
  pt: ["Completa os primeiros três recibos", "Adiciona três recibos consecutivos da mesma frequência da mesma empresa para desbloquear a análise.", "Início concluído. Podes continuar a adicionar recibos um a um.", "Confere a empresa, a frequência dos pagamentos e a continuidade das datas."],
  lt: ["Pridėkite pirmus tris lapelius", "Analizei reikia trijų iš eilės einančių vienodo dažnio lapelių iš to paties darbdavio.", "Pradžia užbaigta. Toliau galite pridėti lapelius po vieną.", "Patikrinkite darbdavį, mokėjimų dažnį ir datų tęstinumą."],
  ro: ["Adaugă primele trei fluturașe", "Adaugă trei fluturașe consecutive cu aceeași frecvență de la același angajator pentru analiză.", "Configurare încheiată. Poți continua să adaugi fluturașe individual.", "Verifică angajatorul, frecvența plăților și continuitatea datelor."],
  ru: ["Добавьте первые три расчётных листка", "Для анализа добавьте три последовательных листка с одинаковой периодичностью одного работодателя.", "Начальный этап завершён. Далее можно добавлять листки по одному.", "Проверьте работодателя, периодичность выплат и непрерывность дат."],
};

const progressLabels: Record<Locale, [string, string]> = {
  es: ["Nóminas guardadas", "Períodos consecutivos"],
  en: ["Saved payslips", "Consecutive pay periods"],
  de: ["Gespeicherte Abrechnungen", "Aufeinanderfolgende Abrechnungszeiträume"],
  pl: ["Zapisane paski wypłaty", "Kolejne okresy wypłaty"],
  pt: ["Recibos guardados", "Períodos consecutivos"],
  lt: ["Išsaugoti lapeliai", "Iš eilės einantys laikotarpiai"],
  ro: ["Fluturași salvați", "Perioade consecutive"],
  ru: ["Сохранённые расчётные листки", "Последовательные периоды"],
};

export function PayslipProgress({ have, required, unlocked, needsDetails = false, savedCount, paymentGap }: { have: number; required: number; unlocked: boolean; needsDetails?: boolean; savedCount?: number; paymentGap?: { dates: string[]; days: number; expected: number } }) {
  const { locale } = useT();
  const c = copy[locale];
  const labels = progressLabels[locale];
  return <section className="rounded-xl border border-accent/40 bg-accent/10 p-5" aria-label={c[0]}>
    {savedCount !== undefined && <p className="mb-3 font-medium">{labels[0]}: {savedCount}</p>}
    <p className="font-heading text-2xl font-semibold">{Math.min(have, required)} / {required}<span className="ml-2 font-sans text-sm font-normal">{labels[1]}</span></p>
    <p className="mt-2 font-medium">{unlocked ? c[2] : c[0]}</p>
    {!unlocked && <p className="mt-2 text-sm leading-6">{c[1]}</p>}
    <progress className="mt-4 h-2 w-full accent-amber-500" value={Math.min(have, required)} max={required} aria-label={labels[1]} />
    {needsDetails && !unlocked && <div role="status" className="mt-3 rounded-lg border border-accent/40 bg-background p-3 text-sm leading-6">
      <p>{c[3]}</p>
      {paymentGap && <p className="mt-2 font-medium">{locale === "es"
        ? `Las fechas de pago son ${paymentGap.dates.join(" y ")}: están separadas por ${paymentGap.days} días. Con la frecuencia indicada se esperan ${paymentGap.expected} días entre pagos consecutivos. Ambos documentos están guardados; el contador mide la secuencia consecutiva más larga, no el total de archivos. No se han deducido fechas de trabajo.`
        : `Payment dates: ${paymentGap.dates.join(" / ")} — ${paymentGap.days} days apart; the declared frequency expects ${paymentGap.expected} days between consecutive payments. Both documents are saved. The counter measures the longest consecutive sequence, not the file total. Worked dates have not been inferred.`}</p>}
    </div>}
  </section>;
}
