import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { PricingService } from "@/data/service-pricing-types";
import { getProviderSecret, type ProviderRecord } from "@/lib/orbit/providers";
import { panelPost } from "@/lib/smm-upstream/panel";

const FILE = path.join(process.cwd(), "data", "runtime", "upstream-catalog.json");
const LOCAL_ID_BASE = 9_000_000;

export type UpstreamService = {
  localId: number;
  providerId: string;
  upstreamId: number;
  name: string;
  category: string;
  platform: string;
  type: string;
  costPer1000: number;
  ratePer1000: number;
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
};

type CatalogFile = {
  syncedAt: string | null;
  providerId: string | null;
  markupPercent: number;
  services: UpstreamService[];
};

export function sellRatePer1000(cost: number, markupPercent: number) {
  if (!Number.isFinite(cost) || cost < 0) return 0;
  const markup = Number.isFinite(markupPercent) ? markupPercent : 30;
  return Math.round(cost * (1 + markup / 100) * 10000) / 10000;
}

export function platformFromCategory(category: string) {
  const text = category.toLowerCase();
  if (text.includes("instagram")) return "instagram";
  if (text.includes("facebook")) return "facebook";
  if (text.includes("youtube") || text.includes("you tube")) return "youtube";
  if (text.includes("tiktok") || text.includes("tik tok")) return "tiktok";
  if (text.includes("telegram")) return "telegram";
  if (text.includes("twitter") || text.includes(" x ") || text.startsWith("x ") || text.includes("x (")) return "x";
  if (text.includes("thread")) return "threads";
  if (text.includes("whatsapp")) return "whatsapp";
  if (text.includes("snapchat")) return "snapchat";
  if (text.includes("linkedin")) return "linkedin";
  if (text.includes("spotify")) return "spotify";
  if (text.includes("pinterest")) return "pinterest";
  return "other";
}

function empty(): CatalogFile {
  return { syncedAt: null, providerId: null, markupPercent: 30, services: [] };
}

export function readUpstreamCatalogSync(): CatalogFile {
  try {
    if (!existsSync(FILE)) return empty();
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as CatalogFile;
    parsed.services ??= [];
    return parsed;
  } catch {
    return empty();
  }
}

export function upstreamCatalogStamp() {
  return existsSync(FILE) ? String(statSync(FILE).mtimeMs) : "0";
}

export function upstreamAsPricing(row: UpstreamService): PricingService {
  return {
    id: row.localId,
    name: row.name,
    category: row.category,
    platform: row.platform,
    group: row.category,
    ratePer1000: row.ratePer1000,
    minOrder: String(row.min),
    maxOrder: String(row.max),
    avgTime: "After the server accepts the order",
    description: `${row.type}. Provider rate $${row.costPer1000.toFixed(4)} per 1,000. The listed rate includes the Server API markup.`,
  };
}

export function findUpstreamService(localId: number) {
  return readUpstreamCatalogSync().services.find((row) => row.localId === localId) ?? null;
}

type RawService = {
  service?: number | string;
  name?: string;
  type?: string;
  category?: string;
  rate?: number | string;
  min?: number | string;
  max?: number | string;
  refill?: boolean;
  cancel?: boolean;
};

export async function syncProviderCatalog(provider: ProviderRecord) {
  if (!provider.apiKey.trim()) return { error: "Save the server API key first." as const };
  const result = await panelPost(provider, { action: "services" });
  if (!result.ok) return { error: result.error };
  const rows = Array.isArray(result.data) ? (result.data as RawService[]) : [];
  if (!rows.length) return { error: "The server API returned no services." as const };
  const markup = provider.markupPercent ?? 30;
  const services: UpstreamService[] = [];
  for (const row of rows) {
    const upstreamId = Number(row.service);
    const cost = Number(row.rate);
    const min = Number(row.min);
    const max = Number(row.max);
    if (!Number.isFinite(upstreamId) || !Number.isFinite(cost)) continue;
    const category = String(row.category || "Other").trim() || "Other";
    services.push({
      localId: LOCAL_ID_BASE + upstreamId,
      providerId: provider.id,
      upstreamId,
      name: String(row.name || `Service ${upstreamId}`).trim(),
      category,
      platform: platformFromCategory(category),
      type: String(row.type || "Default"),
      costPer1000: Math.round(cost * 10000) / 10000,
      ratePer1000: sellRatePer1000(cost, markup),
      min: Number.isFinite(min) ? min : 1,
      max: Number.isFinite(max) ? max : min,
      refill: Boolean(row.refill),
      cancel: Boolean(row.cancel),
    });
  }
  const file: CatalogFile = {
    syncedAt: new Date().toISOString(),
    providerId: provider.id,
    markupPercent: markup,
    services,
  };
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(file), "utf8");
  const categories = new Set(services.map((row) => row.category));
  return { services: services.length, categories: categories.size, markupPercent: markup, syncedAt: file.syncedAt };
}

export async function serverApiSummary(category?: string) {
  const file = readUpstreamCatalogSync();
  const provider = file.providerId ? await getProviderSecret(file.providerId) : null;
  const counts = new Map<string, number>();
  for (const row of file.services) counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  const categories = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const selected = category && counts.has(category) ? category : categories[0]?.name ?? "";
  const services = file.services
    .filter((row) => row.category === selected)
    .map((row) => ({
      id: row.upstreamId,
      localId: row.localId,
      name: row.name,
      category: row.category,
      costPer1000: row.costPer1000,
      ratePer1000: row.ratePer1000,
      min: row.min,
      max: row.max,
    }));
  return {
    provider: provider
      ? {
          id: provider.id,
          name: provider.name,
          endpoint: provider.endpoint,
          markupPercent: provider.markupPercent ?? 30,
          hasKey: Boolean(provider.apiKey.trim()),
          lastStatus: provider.lastStatus ?? "Not checked",
        }
      : null,
    syncedAt: file.syncedAt,
    markupPercent: file.markupPercent || 30,
    serviceCount: file.services.length,
    categoryCount: categories.length,
    categories,
    category: selected,
    services,
  };
}

export async function readCatalogFile() {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as CatalogFile;
  } catch {
    return empty();
  }
}
