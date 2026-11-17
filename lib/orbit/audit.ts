import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type AdminAudit = {
  id: string;
  actor: "orbit-super-admin";
  action: string;
  detail: string;
  createdAt: string;
};

const FILE = path.join(process.cwd(), "data", "runtime", "orbit-audit.json");

export async function recordAdminAction(action: string, detail: string) {
  let rows: AdminAudit[] = [];
  try {
    rows = JSON.parse(await readFile(FILE, "utf8")) as AdminAudit[];
  } catch {
    rows = [];
  }
  rows.unshift({
    id: `aud_${randomBytes(6).toString("hex")}`,
    actor: "orbit-super-admin",
    action,
    detail,
    createdAt: new Date().toISOString(),
  });
  rows = rows.slice(0, 400);
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function listAdminActions() {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as AdminAudit[];
  } catch {
    return [];
  }
}
