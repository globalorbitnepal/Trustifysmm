import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type SiteRedirect = {
  id: string;
  from: string;
  to: string;
  enabled: boolean;
};

const FILE = path.join(process.cwd(), "data", "runtime", "redirects.json");

export function readRedirectsSync(): SiteRedirect[] {
  try {
    if (!existsSync(FILE)) return [];
    const rows = JSON.parse(readFileSync(FILE, "utf8")) as SiteRedirect[];
    return Array.isArray(rows) ? rows.filter((row) => row.enabled && row.from.startsWith("/") && row.from !== row.to) : [];
  } catch {
    return [];
  }
}

async function readAll(): Promise<SiteRedirect[]> {
  try {
    const rows = JSON.parse(await readFile(FILE, "utf8")) as SiteRedirect[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export async function listRedirects() {
  return readAll();
}

export async function saveRedirect(input: Partial<SiteRedirect>) {
  const from = input.from?.trim() || "";
  const to = input.to?.trim() || "";
  if (!from.startsWith("/") || from.startsWith("/orbit") || from.startsWith("/api")) {
    return { error: "Redirects must start with / and cannot target Orbit or API paths." as const };
  }
  if (!to.startsWith("/") && !to.startsWith("https://")) return { error: "Destination must be a site path or https URL." as const };
  if (from === to) return { error: "Source and destination must differ." as const };
  const rows = await readAll();
  if (input.id) {
    const row = rows.find((item) => item.id === input.id);
    if (!row) return { error: "Redirect not found." as const };
    Object.assign(row, { from, to, enabled: input.enabled !== false });
  } else {
    rows.unshift({ id: `red_${randomBytes(4).toString("hex")}`, from, to, enabled: input.enabled !== false });
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
  return { redirects: rows };
}

export async function deleteRedirect(id: string) {
  const rows = (await readAll()).filter((row) => row.id !== id);
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
  return { redirects: rows };
}
