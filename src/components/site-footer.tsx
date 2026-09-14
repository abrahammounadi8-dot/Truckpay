import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-heading text-2xl font-semibold tracking-wide">Truckpay</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-primary-foreground/70">
            Advertised pay next to what drivers actually take home. Built from
            settlements, not recruiter scripts.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-foreground/50 uppercase">Look up</p>
          <div className="mt-3 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/companies" className="hover:text-primary-foreground">
              Company directory
            </Link>
            <Link href="/rankings" className="hover:text-primary-foreground">
              Biggest pay gaps
            </Link>
            <Link href="/compare" className="hover:text-primary-foreground">
              Side-by-side compare
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-primary-foreground/50 uppercase">Drivers</p>
          <div className="mt-3 flex flex-col gap-2 text-primary-foreground/75">
            <Link href="/report" className="hover:text-primary-foreground">
              File a pay report
            </Link>
            <p>Reports land on the company file for other drivers to read.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
