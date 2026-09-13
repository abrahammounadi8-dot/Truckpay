import type { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompanyMark({
  company,
  size = "md",
}: {
  company: Pick<Company, "initials" | "hue" | "shortName">;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-8 text-[0.65rem]" : size === "lg" ? "size-14 text-lg" : "size-11 text-sm";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-heading font-semibold tracking-wide text-white shadow-inner",
        dim,
      )}
      style={{ background: `oklch(0.38 0.09 ${company.hue})` }}
    >
      {company.initials}
    </span>
  );
}
