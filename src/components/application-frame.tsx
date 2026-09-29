"use client";
import { usePathname } from "next/navigation";
import { AppStoreProvider } from "@/lib/store";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PreviewNotice } from "@/components/preview-notice";
import { CompareDock } from "@/components/compare-dock";
export function ApplicationFrame({children}:{children:React.ReactNode}) {
 const pathname=usePathname();
 // The sample experience never mounts the live report store or its API effects.
 if(pathname==="/"||pathname==="/demo")return <main className="flex-1">{children}</main>;
 return <AppStoreProvider><SiteHeader/><PreviewNotice/><main className="flex-1">{children}</main><SiteFooter/><CompareDock/></AppStoreProvider>;
}
