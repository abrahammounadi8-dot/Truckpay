import { database, usesDatabase } from "@/lib/persistence/database";
import { DocumentRepository } from "@/lib/persistence/documents";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmploymentProfile } from "@/lib/payroll/types";

type Disk = { profiles: EmploymentProfile[] };

type GlobalStore = {
  truckpayProfiles?: EmploymentProfile[];
};

function storePath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "truckpay-profiles.json");
  }
  return path.join(process.cwd(), "data", "profiles.json");
}

async function readAll(): Promise<EmploymentProfile[]> {
  const globalStore = globalThis as GlobalStore;
  if (globalStore.truckpayProfiles) return globalStore.truckpayProfiles;
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Disk;
    globalStore.truckpayProfiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
    return globalStore.truckpayProfiles;
  } catch {
    globalStore.truckpayProfiles = [];
    return [];
  }
}

async function writeAll(profiles: EmploymentProfile[]) {
  (globalThis as GlobalStore).truckpayProfiles = profiles;
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify({ profiles }, null, 2)}\n`, "utf8");
}

export async function getProfile(userId: string): Promise<EmploymentProfile | null> {
  if (usesDatabase()) return new DocumentRepository(database()).get<EmploymentProfile>("profile", userId, userId);
  const all = await readAll();
  return all.find((profile) => profile.userId === userId) ?? null;
}

export async function saveProfile(profile: EmploymentProfile): Promise<EmploymentProfile> {
  if (usesDatabase()) return new DocumentRepository(database()).save("profile", profile.userId, profile.userId, profile);
  const all = await readAll();
  await writeAll([profile, ...all.filter((item) => item.userId !== profile.userId)]);
  return profile;
}

export async function deleteProfile(userId: string): Promise<void> {
  if (usesDatabase()) { await new DocumentRepository(database()).remove("profile", userId); return; }
  const all = await readAll();
  await writeAll(all.filter((profile) => profile.userId !== userId));
}

export async function listProfiles(): Promise<EmploymentProfile[]> {
  if (usesDatabase()) return new DocumentRepository(database()).list<EmploymentProfile>("profile");
  return readAll();
}
