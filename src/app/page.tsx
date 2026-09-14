import { HomeBoard } from "@/components/home-board";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div>
      <HomeBoard />
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
          <Step
            n="01"
            title="Check the slip"
            body="Payment date, period, hours, rates, gross, net and each deduction — privately. One slip is not assumed to be one week."
          />
          <Step
            n="02"
            title="Public facts only"
            body="HQ, lanes and fleet notes come from the haulier’s own site. No invented ratings or reviews."
          />
          <Step
            n="03"
            title="Optional public stub"
            body="If you choose to file a community slip, that is a separate, older flow. Your private ledger is not posted to the board."
          />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-14 sm:flex-row">
          <Link
            href="/payslips/new"
            className={cn(buttonVariants({ size: "lg" }), "bg-accent text-accent-foreground hover:bg-accent/90")}
          >
            Check a payslip
          </Link>
          <Link
            href="/report"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
            )}
          >
            File a public slip
          </Link>
          <Link
            href="/list"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
            )}
          >
            List your firm
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <p className="font-mono text-xs text-accent">{n}</p>
      <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-primary-foreground/70">{body}</p>
    </div>
  );
}
