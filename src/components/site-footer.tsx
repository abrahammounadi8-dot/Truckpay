import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-heading text-lg font-semibold tracking-wide">Truckpay</p>
          <p className="mt-2 max-w-xs text-sm text-primary-foreground/70">
            Advertised pay next to what drivers actually take home. Built from
            settlements, not recruiter scripts.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Look up</p>
          <div className="mt-2 flex flex-col gap-1.5 text-primary-foreground/70">
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
          <p className="font-medium">Drivers</p>
          <div className="mt-2 flex flex-col gap-1.5 text-primary-foreground/70">
            <Link href="/report" className="hover:text-primary-foreground">
              File a pay report
            </Link>
            <p>Reports are posted to the company file for other drivers to read.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
