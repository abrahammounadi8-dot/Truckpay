import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Listing = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  county: string;
  website: string;
  note: string;
  submittedAt: string;
};

function storePath() {
  const dir =
    process.env.VERCEL
      ? path.join("/tmp", "truckpay")
      : path.join(process.cwd(), "data");
  return { dir, file: path.join(dir, "listings.json") };
}

async function readListings(): Promise<Listing[]> {
  try {
    const raw = await readFile(/* turbopackIgnore: true */ storePath().file, "utf8");
    const parsed = JSON.parse(raw) as { listings?: Listing[] };
    return parsed.listings ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  const listings = await readListings();
  return NextResponse.json({ count: listings.length });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Listing>;
  const companyName = String(body.companyName ?? "").trim();
  const contactName = String(body.contactName ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!companyName || !contactName || !email.includes("@")) {
    return NextResponse.json(
      { error: "Company, contact and a valid email are required." },
      { status: 400 },
    );
  }
  const listing: Listing = {
    id: crypto.randomUUID(),
    companyName,
    contactName,
    email,
    phone: String(body.phone ?? "").trim(),
    county: String(body.county ?? "").trim(),
    website: String(body.website ?? "").trim(),
    note: String(body.note ?? "").trim().slice(0, 2000),
    submittedAt: new Date().toISOString().slice(0, 10),
  };
  const { dir, file } = storePath();
  await mkdir(dir, { recursive: true });
  const listings = await readListings();
  listings.unshift(listing);
  await writeFile(file, JSON.stringify({ listings }, null, 2));
  return NextResponse.json({ ok: true }, { status: 201 });
}
