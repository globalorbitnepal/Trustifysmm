import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ApiActivity = {
  id: string;
  at: string;
  userId: string | null;
  email: string | null;
  action: string;
  ip: string;
  ok: boolean;
  detail: string;
  orderId: number | null;
  keyPrefix: string;
};

type FileShape = { events: ApiActivity[] };

const FILE = path.join(process.cwd(), "data", "runtime", "api-activity.json");
const MAX = 400;

export async function recordApiActivity(row: Omit<ApiActivity, "id" | "at">) {
  try {
    const file = await read();
    file.events.push({
      ...row,
      id: `api_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toISOString(),
      detail: row.detail.slice(0, 180),
      ip: row.ip.slice(0, 64) || "unknown",
      keyPrefix: row.keyPrefix.slice(0, 12),
    });
    file.events = file.events.slice(-MAX);
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(file), "utf8");
  } catch (error) {
    console.error("api activity log failed", error);
  }
}

export async function listApiActivity(limit = 200) {
  const file = await read();
  return file.events.slice(-limit).reverse();
}

async function read(): Promise<FileShape> {
  try {
    const parsed = JSON.parse(await readFile(FILE, "utf8")) as FileShape;
    if (!Array.isArray(parsed.events)) return { events: [] };
    return parsed;
  } catch {
    return { events: [] };
  }
}
