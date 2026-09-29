import type { Metadata } from "next";
import { DemoExperience } from "@/components/demo-experience";
export const metadata: Metadata = { title: "MyTruckPay Demo", robots: { index:false, follow:false } };
export default async function DemoPage({searchParams}:{searchParams:Promise<{view?:string;q?:string;company?:string}>}) {
 const params=await searchParams;
 return <DemoExperience view={params.view ?? "slips"} query={params.q ?? ""} company={params.company ?? ""} />;
}
