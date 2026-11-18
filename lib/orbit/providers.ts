import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type ProviderRecord = {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  /** Percent added on top of the provider rate. Service API uses 30. */
  markupPercent?: number;
  lastStatus?: string;
  lastCheckedAt?: string;
};

const FILE = path.join(process.cwd(), "data", "runtime", "providers.json");

async function readAll(): Promise<ProviderRecord[]> {
  try {
    const rows = JSON.parse(await readFile(FILE, "utf8")) as ProviderRecord[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: ProviderRecord[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

export function publicProvider(row: ProviderRecord) {
  const key = row.apiKey.trim();
  return {
    id: row.id,
    name: row.name,
    endpoint: row.endpoint,
    enabled: row.enabled,
    priority: row.priority,
    markupPercent: row.markupPercent ?? 30,
    keyMasked: key ? `${key.slice(0, 3)}…${key.slice(-2)}` : "",
    hasKey: Boolean(key),
    lastStatus: row.lastStatus ?? "Not checked",
    lastCheckedAt: row.lastCheckedAt ?? null,
  };
}

export async function listProviders() {
  return (await readAll()).map(publicProvider);
}

export async function saveProvider(input: Partial<ProviderRecord> & { id?: string }) {
  const rows = await readAll();
  const name = input.name?.trim() || "";
  const endpoint = input.endpoint?.trim() || "";
  if (name.length < 2) return { error: "Provider name is required." as const };
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad");
  } catch {
    return { error: "Enter a valid API endpoint URL." as const };
  }
  if (input.id) {
    const row = rows.find((item) => item.id === input.id);
    if (!row) return { error: "Provider not found." as const };
    row.name = name;
    row.endpoint = endpoint;
    if (input.apiKey) row.apiKey = input.apiKey.trim();
    if (input.enabled !== undefined) row.enabled = input.enabled;
    if (input.priority !== undefined) row.priority = Number(input.priority) || 1;
    if (input.markupPercent !== undefined) row.markupPercent = Number(input.markupPercent) || 0;
    await writeAll(rows);
    return { provider: publicProvider(row) };
  }
  const row: ProviderRecord = {
    id: `prv_${randomBytes(4).toString("hex")}`,
    name,
    endpoint,
    apiKey: input.apiKey?.trim() || "",
    enabled: input.enabled !== false,
    priority: Number(input.priority) || rows.length + 1,
    markupPercent: input.markupPercent !== undefined ? Number(input.markupPercent) || 0 : 30,
  };
  rows.push(row);
  await writeAll(rows);
  return { provider: publicProvider(row) };
}

export async function getProviderSecret(id: string) {
  const rows = await readAll();
  return rows.find((item) => item.id === id) ?? null;
}

export async function listProviderSecrets() {
  return readAll();
}

/** Loads the HonestSMM key from the server env into the local provider store. The key is never returned. */
export async function ensureHonestProvider() {
  const apiKey = process.env.HONESTSMM_API_KEY?.trim() || "";
  if (!apiKey) return null;
  const endpoint = process.env.HONESTSMM_API_URL?.trim() || "https://honestsmm.com/api/v2";
  const markupPercent = Number(process.env.HONESTSMM_MARKUP_PERCENT || 30);
  const rows = await readAll();
  const existing = rows.find((row) => row.endpoint.includes("honestsmm.com") || row.name.toLowerCase() === "honestsmm");
  if (
    existing &&
    existing.apiKey === apiKey &&
    existing.endpoint === endpoint &&
    (existing.markupPercent ?? 30) === markupPercent &&
    existing.enabled
  ) {
    return existing;
  }
  const saved = await saveProvider({
    id: existing?.id,
    name: "HonestSMM",
    endpoint,
    apiKey,
    markupPercent: Number.isFinite(markupPercent) ? markupPercent : 30,
    enabled: true,
  });
  if ("error" in saved) return existing ?? null;
  return (await readAll()).find((row) => row.id === saved.provider.id) ?? null;
}

export async function testProvider(id: string) {
  const rows = await readAll();
  const row = rows.find((item) => item.id === id);
  if (!row) return { error: "Provider not found." as const };
  if (!row.apiKey) return { error: "Save an API key before testing." as const };
  const body = new URLSearchParams({ key: row.apiKey, action: "balance" });
  try {
    const response = await fetch(row.endpoint, { method: "POST", body, signal: AbortSignal.timeout(8000) });
    const text = await response.text();
    row.lastCheckedAt = new Date().toISOString();
    row.lastStatus = response.ok ? "Connected" : `API Error ${response.status}`;
    await writeAll(rows);
    return { status: row.lastStatus, preview: text.slice(0, 180).replace(row.apiKey, "••••") };
  } catch {
    row.lastCheckedAt = new Date().toISOString();
    row.lastStatus = "Disconnected";
    await writeAll(rows);
    return { status: row.lastStatus, preview: "" };
  }
}
