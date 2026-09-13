"use client";

import { useMemo, useState } from "react";
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
import { payGapPercent, reportedWeekly } from "@/lib/metrics";
import type { Equipment } from "@/lib/types";

const equipmentOptions: { value: Equipment | "all"; label: string }[] = [
  { value: "all", label: "All equipment" },
  { value: "dry-van", label: "Dry van" },
  { value: "reefer", label: "Reefer" },
  { value: "flatbed", label: "Flatbed" },
  { value: "tanker", label: "Tanker" },
  { value: "specialized", label: "Specialized" },
];

type SortKey = "gap" | "reported" | "rating" | "home";

export function CompanyDirectory({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [equipment, setEquipment] = useState<Equipment | "all">("all");
  const [sort, setSort] = useState<SortKey>("gap");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = fleet.filter((company) => {
      const matchesQuery =
        !needle ||
        company.name.toLowerCase().includes(needle) ||
        company.headquarters.toLowerCase().includes(needle) ||
        company.summary.toLowerCase().includes(needle);
      const matchesEquipment = equipment === "all" || company.equipment.includes(equipment);
      return matchesQuery && matchesEquipment;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "gap") return payGapPercent(b) - payGapPercent(a);
      if (sort === "reported") return reportedWeekly(b) - reportedWeekly(a);
      if (sort === "rating") return b.reported.rating - a.reported.rating;
      return a.reported.homeTimeDaysOut - b.reported.homeTimeDaysOut;
    });
  }, [query, equipment, sort]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Carrier, city, or keyword"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Equipment</Label>
          <Select value={equipment} onValueChange={(value) => setEquipment((value as Equipment | "all") ?? "all")}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {equipmentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Sort</Label>
          <Select value={sort} onValueChange={(value) => setSort((value as SortKey) ?? "gap")}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gap">Biggest pay gap</SelectItem>
              <SelectItem value="reported">Highest reported weekly</SelectItem>
              <SelectItem value="rating">Best rating</SelectItem>
              <SelectItem value="home">Best home time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold">No carriers match that search</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a company name, or clear equipment to see the full board.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
