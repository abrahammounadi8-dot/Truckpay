"use client";

import { useT } from "@/components/language-provider";
import { faqCopy } from "@/lib/seo/faq-copy";

export function FaqBoard() {
  const { locale } = useT();
  const copy = faqCopy(locale);

  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {copy.kicker}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{copy.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.lead}</p>
      <dl className="mt-10 divide-y divide-border border-y border-border">
        {copy.items.map((item) => (
          <div key={item.q} className="py-5">
            <dt className="text-lg font-semibold tracking-tight">{item.q}</dt>
            <dd className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
