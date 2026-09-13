import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">That carrier is not on the board</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The company file is missing, or the link is stale. Start from the directory.
      </p>
      <Link href="/companies" className={cn(buttonVariants(), "mt-6")}>
        Browse companies
      </Link>
    </div>
  );
}
