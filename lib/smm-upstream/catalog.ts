import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { PricingService } from "@/data/service-pricing-types";
import { getProviderSecret, type ProviderRecord } from "@/lib/orbit/providers";
import { sortPlatformIds } from "@/lib/catalog-platform-order";
import { panelPost } from "@/lib/smm-upstream/panel";
import { publicDescription, publicText } from "@/lib/smm-upstream/public-text";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  telegram: "Telegram",
  x: "X (Twitter)",
  threads: "Threads",
  whatsapp: "WhatsApp",
  snapchat: "Snapchat",
  linkedin: "LinkedIn",
  spotify: "Spotify",
  pinterest: "Pinterest",
  other: "Other Services",
};
import { listAllOrders } from "@/lib/smm-api/demo-store";
import { listCustomers } from "@/lib/customer/user-store";

const FILE = path.join(process.cwd(), "data", "runtime", "upstream-catalog.json");
/**
 * Customer-facing service codes start here. They are assigned in sync order and never
 * derived from the provider id, so nothing on the site can be reversed into a server id.
 */
const FIRST_LOCAL_ID = 10_001;

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
  /** Price set in Orbit for one service, in USD per 1,000. Overrides the markup. */
  priceOverrides?: Record<string, number>;
  /** Price applied to every service in a category before per-service edits. */
  categoryPrices?: Record<string, number>;
  /** Next customer-facing service code to hand out. */
  nextLocalId?: number;
  /** Upstream service id to the customer-facing code, kept so a sync never changes it. */
  codes?: Record<string, number>;
};

/** Customer price for one row: manual service price, then category price, then markup. */
export function effectiveRate(row: UpstreamService, file: { markupPercent: number; priceOverrides?: Record<string, number>; categoryPrices?: Record<string, number> }) {
  const manual = file.priceOverrides?.[String(row.localId)];
  if (typeof manual === "number" && Number.isFinite(manual) && manual >= 0) return Math.round(manual * 10000) / 10000;
  const category = file.categoryPrices?.[row.category];
  if (typeof category === "number" && Number.isFinite(category) && category >= 0) {
    return Math.round(category * (1 + (file.markupPercent || 0) / 100) * 10000) / 10000;
  }
  return sellRatePer1000(row.costPer1000, file.markupPercent);
}

/** Manual price for a service code, falling back to a legacy server-id key. */
function manualPrice(file: CatalogFile, localId: number) {
  const direct = file.priceOverrides?.[String(localId)];
  return typeof direct === "number" ? direct : undefined;
}

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
  return { syncedAt: null, providerId: null, markupPercent: 30, services: [], priceOverrides: {}, categoryPrices: {} };
}

function withPrices(file: CatalogFile): CatalogFile {
  file.priceOverrides ??= {};
  file.categoryPrices ??= {};
  file.codes ??= {};
  return file;
}

export function readUpstreamCatalogSync(): CatalogFile {
  try {
    if (!existsSync(FILE)) return empty();
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as CatalogFile;
    parsed.services ??= [];
    return withPrices(parsed);
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
    name: publicText(row.name) || `Service ${row.localId}`,
    category: publicText(row.category) || "Other",
    platform: row.platform,
    group: publicText(row.category) || "Other",
    ratePer1000: row.ratePer1000,
    minOrder: String(row.min),
    maxOrder: String(row.max),
    avgTime: "Starts after the order is accepted",
    description: publicDescription(row.type),
    refill: row.refill,
  };
}

export function findUpstreamService(localId: number) {
  return readUpstreamCatalogSync().services.find((row) => row.localId === localId) ?? null;
}

async function writeCatalog(file: CatalogFile) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(withPrices(file)), "utf8");
}

/** Set the customer price for one service in USD per 1,000. */
export async function setServicePrice(localId: number, ratePer1000: number | null) {
  const file = withPrices(await readCatalogFile());
  const row = file.services.find((service) => service.localId === localId);
  if (!row) return { error: "Service not found." as const };
  if (ratePer1000 === null) delete file.priceOverrides![String(localId)];
  else {
    if (!Number.isFinite(ratePer1000) || ratePer1000 < 0) return { error: "Enter a valid price." as const };
    file.priceOverrides![String(localId)] = Math.round(ratePer1000 * 10000) / 10000;
  }
  row.ratePer1000 = effectiveRate(row, file);
  await writeCatalog(file);
  return { services: file.services, row };
}

/** Set the base cost for every service in a category, before the markup. Null removes it. */
export async function setCategoryPrice(category: string, ratePer1000: number | null) {
  const file = withPrices(await readCatalogFile());
  if (!file.services.some((service) => service.category === category)) return { error: "Category not found." as const };
  if (ratePer1000 === null) delete file.categoryPrices![category];
  else {
    if (!Number.isFinite(ratePer1000) || ratePer1000 < 0) return { error: "Enter a valid price." as const };
    file.categoryPrices![category] = Math.round(ratePer1000 * 10000) / 10000;
  }
  for (const row of file.services) if (row.category === category) row.ratePer1000 = effectiveRate(row, file);
  await writeCatalog(file);
  return { count: file.services.filter((service) => service.category === category).length };
}

/** Recalculate every sell price after a sync or a markup change. */
export async function repriceCatalog(markupPercent?: number) {
  const file = withPrices(await readCatalogFile());
  if (markupPercent !== undefined) file.markupPercent = markupPercent;
  for (const row of file.services) row.ratePer1000 = effectiveRate(row, file);
  await writeCatalog(file);
  return { services: file.services.length, markupPercent: file.markupPercent };
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
  const previous = withPrices(await readCatalogFile());
  const markup = provider.markupPercent ?? previous.markupPercent ?? 30;
  const services: UpstreamService[] = [];
  const codes: Record<string, number> = { ...previous.codes };
  const used = new Set(Object.values(codes));
  let nextCode = Math.max(previous.nextLocalId ?? FIRST_LOCAL_ID, FIRST_LOCAL_ID);

  for (const row of rows) {
    const upstreamId = Number(row.service);
    const cost = Number(row.rate);
    const min = Number(row.min);
    const max = Number(row.max);
    if (!Number.isFinite(upstreamId) || !Number.isFinite(cost)) continue;
    const category = String(row.category || "Other").trim() || "Other";
    const name = String(row.name || "").trim();
    /* The provider lists section dividers (`-----`, `\\\\\\`, emoji rules) as services. They are
     * layout, not something a customer can buy, so they never enter the catalog. */
    if (!/[\p{L}\p{N}]/u.test(name)) continue;
    let localId = codes[String(upstreamId)];
    if (!localId) {
      while (used.has(nextCode)) nextCode += 1;
      localId = nextCode;
      used.add(localId);
      nextCode += 1;
      codes[String(upstreamId)] = localId;
    }
    services.push({
      localId,
      providerId: provider.id,
      upstreamId,
      name: name || `Service ${upstreamId}`,
      category,
      platform: platformFromCategory(category),
      type: String(row.type || "Default"),
      costPer1000: Math.round(cost * 10000) / 10000,
      ratePer1000: 0,
      min: Number.isFinite(min) ? min : 1,
      max: Number.isFinite(max) ? max : min,
      refill: Boolean(row.refill),
      cancel: Boolean(row.cancel),
    });
  }
  /* Prices follow the code, so a manual price stays on the same service after a sync. */
  const previousCodeByUpstream = new Map(previous.services.map((row) => [row.localId, row.upstreamId]));
  const priceOverrides: Record<string, number> = {};
  for (const [oldLocalId, price] of Object.entries(previous.priceOverrides ?? {})) {
    const upstreamId = previousCodeByUpstream.get(Number(oldLocalId));
    const code = upstreamId !== undefined ? codes[String(upstreamId)] : undefined;
    priceOverrides[String(code ?? oldLocalId)] = price;
  }
  const file: CatalogFile = {
    syncedAt: new Date().toISOString(),
    providerId: provider.id,
    markupPercent: markup,
    services,
    priceOverrides,
    categoryPrices: previous.categoryPrices,
    codes,
    nextLocalId: nextCode,
  };
  for (const row of file.services) row.ratePer1000 = effectiveRate(row, file);
  await writeCatalog(file);
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

  /*
   * The same platform grouping the customer dashboard uses, so a category is never
   * listed on its own without the platform it belongs to.
   */
  const platformOf = new Map(file.services.map((row) => [row.category, row.platform]));
  const platformGroups = new Map<string, { name: string; label: string; count: number }[]>();
  for (const row of categories) {
    const key = platformOf.get(row.name) ?? "other";
    const list = platformGroups.get(key) ?? [];
    /* `name` is what the API stores, `label` is exactly what the customer reads. */
    list.push({ name: row.name, label: publicText(row.name) || "Other", count: row.count });
    platformGroups.set(key, list);
  }
  const platformRows = sortPlatformIds([...platformGroups.keys()]).map((id) => ({
    id,
    label: PLATFORM_LABELS[id] ?? "Other Services",
    count: (platformGroups.get(id) ?? []).reduce((sum, row) => sum + row.count, 0),
    categories: platformGroups.get(id) ?? [],
  }));
  /* Default to the first platform's first category, which is what the customer sees first. */
  const firstCategory = platformRows[0]?.categories[0]?.name ?? "";
  const selected = category && counts.has(category) ? category : firstCategory;
  const services = file.services
    .filter((row) => row.category === selected)
    .map((row) => ({
      id: row.upstreamId,
      localId: row.localId,
      name: row.name,
      customerName: publicText(row.name) || `Service ${row.localId}`,
      category: row.category,
      categoryLabel: publicText(row.category) || "Other",
      type: row.type,
      costPer1000: row.costPer1000,
      ratePer1000: row.ratePer1000,
      defaultRatePer1000: sellRatePer1000(row.costPer1000, file.markupPercent),
      manualPrice: file.priceOverrides?.[String(row.localId)] ?? null,
      min: row.min,
      max: row.max,
    }));

  /*
   * Every synced order, so Orbit shows the customer's own order number next to the
   * Server API order id and the Server API service id.
   */
  const owners = await listCustomers();
  const emailByKey = new Map(owners.map((user) => [user.apiKey, user.email]));
  const orders = (await listAllOrders())
    .filter((order) => order.upstreamOrderId)
    .slice(0, 200)
    .map((order) => {
      const mapped = file.services.find((row) => row.localId === order.service);
      return {
        id: order.order,
        upstreamOrderId: order.upstreamOrderId ?? null,
        upstreamServiceId: mapped?.upstreamId ?? order.upstreamServiceId ?? null,
        customer: emailByKey.get(order.accountKey ?? "") ?? "Unlinked",
        service: publicText(mapped?.name ?? "") || `Service ${order.service}`,
        quantity: order.quantity,
        charge: order.charge,
        status: order.status,
        createdAt: order.createdAt,
      };
    });

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
    categoryPrice: file.categoryPrices?.[selected] ?? null,
    serviceCount: file.services.length,
    categoryCount: categories.length,
    categories,
    platformRows,
    category: selected,
    services,
    orders,
  };
}

export async function readCatalogFile() {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as CatalogFile;
  } catch {
    return empty();
  }
}
