import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-heading text-2xl font-semibold tracking-wide">TruckPay</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-primary-foreground/70">
            TruckPay understands your payslip, so you don’t have to. Ireland first. Private payroll
            and company intelligence grow together — never invented reviews.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-foreground/50 uppercase">
            My TruckPay
          </p>
          <div className="mt-3 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/payslips" className="hover:text-primary-foreground">
              Private payslips
            </Link>
            <Link href="/analysis" className="hover:text-primary-foreground">
              Payroll analysis
            </Link>
            <Link href="/profile" className="hover:text-primary-foreground">
              Employment profile
            </Link>
            <Link href="/privacy" className="hover:text-primary-foreground">
              Privacy
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-foreground/50 uppercase">
            TruckPay Companies
          </p>
          <div className="mt-3 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/companies" className="hover:text-primary-foreground">
              Haulier directory
            </Link>
            <Link href="/rankings" className="hover:text-primary-foreground">
              Driver-reported gaps
            </Link>
            <Link href="/compare" className="hover:text-primary-foreground">
              Side-by-side compare
            </Link>
            <Link href="/report" className="hover:text-primary-foreground">
              File a public slip
            </Link>
            <Link href="/list" className="hover:text-primary-foreground">
              List your firm
            </Link>
            <p>Company accounts and recruiters are a later phase. They will never see a driver’s private slips.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
