"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/language-provider";
import { CompanyCard } from "@/components/company-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fleet } from "@/lib/data";
import { companyStats } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";
import type { Equipment } from "@/lib/types";

const equipmentLabels = {
  all: "companies.allEquipment",
  curtain: "companies.curtain",
  reefer: "companies.reefer",
  flatbed: "companies.flatbed",
  tanker: "companies.tanker",
  specialized: "companies.specialized",
} as const;

type SortKey = "name" | "reports" | "pay" | "county";

export function CompanyDirectory({ initialQuery = "" }: { initialQuery?: string }) {
  const { t } = useT();
  const { reports } = useAppStore();
  const [query, setQuery] = useState(initialQuery);
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const [sort, setSort] = useState<SortKey>("name");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = fleet.filter((company) => {
      const matchesQuery =
        !needle ||
        company.name.toLowerCase().includes(needle) ||
        company.headquarters.toLowerCase().includes(needle) ||
        company.county.toLowerCase().includes(needle) ||
        company.summary.toLowerCase().includes(needle);
      const matchesEquipment = equipment === "all" || company.equipment.includes(equipment);
      return matchesQuery && matchesEquipment;
    });

    return [...filtered].sort((a, b) => {
      const statsA = companyStats(a.slug, reports);
      const statsB = companyStats(b.slug, reports);
      if (sort === "reports") return statsB.count - statsA.count;
      if (sort === "pay") return (statsB.avgWeekly ?? 0) - (statsA.avgWeekly ?? 0);
      if (sort === "county") return a.county.localeCompare(b.county);
      return a.name.localeCompare(b.name);
    });
  }, [query, equipment, sort, reports]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:grid-cols-3">
        <div>
          <Label htmlFor="search">{t("companies.search")}</Label>
          <Input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("companies.searchPlaceholder")}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>{t("companies.equipment")}</Label>
          <Select value={equipment} onValueChange={(value) => setEquipment((value as Equipment | "all") ?? "all")}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(equipmentLabels) as Array<keyof typeof equipmentLabels>).map((value) => (
                <SelectItem key={value} value={value}>
                  {t(equipmentLabels[value])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("companies.sort")}</Label>
          <Select value={sort} onValueChange={(value) => setSort((value as SortKey) ?? "name")}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t("companies.sortName")}</SelectItem>
              <SelectItem value="county">{t("companies.sortCounty")}</SelectItem>
              <SelectItem value="reports">{t("companies.sortReports")}</SelectItem>
              <SelectItem value="pay">{t("companies.sortPay")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold">{t("companies.none")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("companies.noneHint")}</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {results.map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
