"use client";
import Link from "next/link";
import { useT } from "./language-provider";
import { accountCopy } from "@/lib/auth/copy";
export function AccountLink() {
  const { locale } = useT();
  return <Link href="/account" className="rounded-md border border-current/20 px-3 py-1.5 text-sm">{accountCopy[locale].title}</Link>;
}
