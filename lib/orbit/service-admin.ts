import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import pricingData from "@/data/service-pricing.json";
import type { PricingService, ServicePricingData } from "@/data/service-pricing-types";

export type CustomService = PricingService & {
  costPer1000?: number;
  active: boolean;
  featured?: boolean;
  refill?: boolean;
  cancel?: boolean;
};

export type ServiceCategory = {
  id: string;
  name: string;
  platform: string;
  description: string;
  active: boolean;
  order: number;
};

export type ServiceAdminFile = {
  hiddenIds: number[];
  groupAlias: Record<string, string>;
  patches: Record<string, Partial<PricingService>>;
  categories: ServiceCategory[];
  custom: CustomService[];
};

const FILE = path.join(process.cwd(), "data", "runtime", "service-admin.json");
const base = pricingData as ServicePricingData;

function empty(): ServiceAdminFile {
  return { hiddenIds: [], groupAlias: {}, patches: {}, categories: [], custom: [] };
}

export function readServiceAdminSync(): ServiceAdminFile {
  try {
    if (!existsSync(FILE)) return empty();
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as ServiceAdminFile;
    parsed.hiddenIds ??= [];
    parsed.groupAlias ??= {};
    parsed.patches ??= {};
    parsed.categories ??= [];
    parsed.custom ??= [];
    return parsed;
  } catch {
    return empty();
  }
}

async function readAdmin(): Promise<ServiceAdminFile> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as ServiceAdminFile;
  } catch {
    return empty();
  }
}

async function writeAdmin(data: ServiceAdminFile) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

function nextServiceId(admin: ServiceAdminFile) {
  const ids = [...base.services.map((service) => service.id), ...admin.custom.map((service) => service.id)];
  return Math.max(0, ...ids) + 1;
}

export function baseService(id: number) {
  return base.services.find((service) => service.id === id) ?? null;
}

export async function saveCategory(input: Omit<ServiceCategory, "id"> & { id?: string; previousName?: string }) {
  const admin = await readAdmin();
  const name = input.name.trim();
  if (name.length < 2) return { error: "Category name is required." as const };
  const previous = (input.previousName || (input.id?.startsWith("group:") ? input.id.slice(6) : "")).trim();
  if (previous && previous.toLowerCase() !== name.toLowerCase()) {
    admin.groupAlias[previous] = name;
    for (const service of admin.custom) {
      if (service.group === previous) service.group = name;
    }
  }
  if (input.id && !input.id.startsWith("group:")) {
    const row = admin.categories.find((category) => category.id === input.id);
    if (!row) return { error: "Category not found." as const };
    Object.assign(row, { ...input, name });
  } else {
    const existing = admin.categories.find((category) => category.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      Object.assign(existing, { name, platform: input.platform || existing.platform, description: input.description ?? existing.description, active: input.active !== false, order: Number(input.order) || existing.order });
    } else {
      admin.categories.push({
        id: `cat_${randomBytes(4).toString("hex")}`,
        name,
        platform: input.platform || "other",
        description: input.description || "",
        active: input.active !== false,
        order: Number(input.order) || admin.categories.length + 1,
      });
    }
  }
  await writeAdmin(admin);
  return { categories: admin.categories };
}

export async function deleteCategory(id: string) {
  const admin = await readAdmin();
  const row = admin.categories.find((category) => category.id === id);
  if (!row) return { error: "Category not found." as const };
  const used = admin.custom.some((service) => service.group === row.name && service.active);
  if (used) return { error: "Move or deactivate services in this category before deleting it." as const };
  admin.categories = admin.categories.filter((category) => category.id !== id);
  await writeAdmin(admin);
  return { categories: admin.categories };
}

export async function createCustomService(input: Partial<CustomService>) {
  const admin = await readAdmin();
  const name = input.name?.trim() || "";
  if (name.length < 2) return { error: "Service name is required." as const };
  const rate = Number(input.ratePer1000);
  if (!Number.isFinite(rate) || rate < 0) return { error: "Selling price is required." as const };
  const service: CustomService = {
    id: nextServiceId(admin),
    name,
    category: input.category || input.group || "Custom",
    platform: input.platform || "other",
    group: input.group || input.category || "Custom",
    ratePer1000: Math.round(rate * 10000) / 10000,
    minOrder: String(input.minOrder || "10"),
    maxOrder: String(input.maxOrder || "100000"),
    avgTime: input.avgTime || "",
    description: input.description || "",
    costPer1000: Number.isFinite(Number(input.costPer1000)) ? Number(input.costPer1000) : undefined,
    active: input.active !== false,
    featured: Boolean(input.featured),
    refill: Boolean(input.refill),
    cancel: input.cancel !== false,
  };
  admin.custom.unshift(service);
  await writeAdmin(admin);
  return { service };
}

export async function updateCustomService(id: number, patch: Partial<CustomService>) {
  const admin = await readAdmin();
  const service = admin.custom.find((row) => row.id === id);
  if (!service) {
    const source = baseService(id);
    if (!source) {
      const fromServer = await setPriceForService(id, Number(patch.ratePer1000 ?? NaN));
      if ("error" in fromServer) return { error: "Service not found." as const };
      return { patched: true };
    }
    admin.patches[String(id)] = { ...admin.patches[String(id)], ...patch, id: source.id };
    if (patch.ratePer1000 !== undefined) {
      const rate = Number(patch.ratePer1000);
      if (!Number.isFinite(rate) || rate < 0) return { error: "Invalid price." as const };
      delete admin.patches[String(id)].ratePer1000;
      const { readPricingOverrides, writePricingOverrides } = await import("@/lib/orbit/pricing-overrides-server");
      const overrides = await readPricingOverrides();
      overrides.overrides[String(id)] = Math.round(rate * 10000) / 10000;
      await writePricingOverrides(overrides);
    }
    await writeAdmin(admin);
    return { patched: true };
  }
  if (patch.name !== undefined) service.name = patch.name;
  if (patch.platform !== undefined) service.platform = patch.platform;
  if (patch.group !== undefined) service.group = patch.group;
  if (patch.description !== undefined) service.description = patch.description;
  if (patch.minOrder !== undefined) service.minOrder = String(patch.minOrder);
  if (patch.maxOrder !== undefined) service.maxOrder = String(patch.maxOrder);
  if (patch.avgTime !== undefined) service.avgTime = patch.avgTime;
  if (patch.ratePer1000 !== undefined) {
    const rate = Number(patch.ratePer1000);
    if (!Number.isFinite(rate) || rate < 0) return { error: "Invalid price." as const };
    service.ratePer1000 = Math.round(rate * 10000) / 10000;
  }
  if (patch.costPer1000 !== undefined) service.costPer1000 = Number(patch.costPer1000);
  if (patch.active !== undefined) service.active = patch.active;
  if (patch.featured !== undefined) service.featured = patch.featured;
  if (patch.refill !== undefined) service.refill = patch.refill;
  if (patch.cancel !== undefined) service.cancel = patch.cancel;
  await writeAdmin(admin);
  return { service };
}

/** Route a price edit from the Services screen to the synced Server API catalog. */
export async function setPriceForService(id: number, ratePer1000: number) {
  const { setServicePrice } = await import("@/lib/smm-upstream/catalog");
  return setServicePrice(id, ratePer1000);
}

export async function duplicateService(id: number) {
  const admin = await readAdmin();
  const custom = admin.custom.find((row) => row.id === id);
  const source = custom ?? baseService(id);
  if (!source) return { error: "Service not found." as const };
  return createCustomService({ ...source, name: `${source.name} copy`, active: true });
}

export async function setServiceHidden(id: number, hidden: boolean) {
  const admin = await readAdmin();
  const custom = admin.custom.find((row) => row.id === id);
  if (custom && hidden) {
    admin.custom = admin.custom.filter((row) => row.id !== id);
    await writeAdmin(admin);
    return { deleted: true };
  }
  if (custom) {
    custom.active = !hidden;
    await writeAdmin(admin);
    return { service: custom };
  }
  admin.hiddenIds = admin.hiddenIds.filter((row) => row !== id);
  if (hidden) admin.hiddenIds.push(id);
  await writeAdmin(admin);
  return { hidden };
}

export function listCategoryRows(admin = readServiceAdminSync()) {
  const counts = new Map<string, number>();
  for (const service of base.services) {
    const group = admin.groupAlias[service.group] ?? service.group;
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  for (const service of admin.custom) {
    if (!service.active) continue;
    counts.set(service.group, (counts.get(service.group) ?? 0) + 1);
  }
  const known = new Set(admin.categories.map((category) => category.name));
  const derived: ServiceCategory[] = [];
  for (const [name, count] of counts) {
    if (known.has(name)) continue;
    derived.push({
      id: `group:${name}`,
      name,
      platform: base.services.find((service) => (admin.groupAlias[service.group] ?? service.group) === name)?.platform ?? "other",
      description: "",
      active: true,
      order: 1000 + derived.length,
    });
    void count;
  }
  return [...admin.categories, ...derived]
    .map((category) => ({ ...category, services: counts.get(category.name) ?? 0 }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
