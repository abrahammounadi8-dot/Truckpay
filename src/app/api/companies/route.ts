import { listDirectoryWithPayStats } from "@/lib/directory-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await listDirectoryWithPayStats(), { headers: { "Cache-Control": "no-store" } });
}
