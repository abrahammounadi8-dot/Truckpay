"use client";

import { useT } from "@/components/language-provider";
import type { MessageKey } from "@/lib/i18n";

export function PageIntro({
  kicker,
  title,
  lead,
  leadClass = "max-w-2xl",
}: {
  kicker: MessageKey;
  title: MessageKey;
  lead: MessageKey;
  leadClass?: string;
}) {
  const { t } = useT();
  return (
    <>
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {t(kicker)}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{t(title)}</h1>
      <p className={`mt-3 ${leadClass} text-sm leading-6 text-muted-foreground`}>{t(lead)}</p>
    </>
  );
}
