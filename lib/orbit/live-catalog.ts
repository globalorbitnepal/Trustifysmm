import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import pricingData from "@/data/service-pricing.json";
import type { PricingService, ServicePricingData } from "@/data/service-pricing-types";
import { readServiceAdminSync } from "@/lib/orbit/service-admin";
import { catalogPlatformRows, mergePlatformLabels, sortPlatformIds } from "@/lib/catalog-platform-order";
import { mergeSiteConfig } from "@/lib/orbit/site-config-sync";
import { readUpstreamCatalogSync, upstreamAsPricing, upstreamCatalogStamp } from "@/lib/smm-upstream/catalog";
import type { OrbitSiteConfig } from "@/lib/orbit/types";

const base = pricingData as ServicePricingData;
const overridesPath = path.join(process.cwd(), "data", "orbit", "pricing-overrides.json");
const configPath = path.join(process.cwd(), "data", "orbit", "site-config.json");
const adminPath = path.join(process.cwd(), "data", "runtime", "service-admin.json");

type Cache = { stamp: string; data: ServicePricingData };
let cache: Cache | null = null;

function stamp() {
  const files = [overridesPath, configPath, adminPath];
  return `${files.map((file) => (existsSync(file) ? String(statSync(file).mtimeMs) : "0")).join(":")}:${upstreamCatalogStamp()}`;
}

function readOverrides() {
  try {
    const parsed = JSON.parse(readFileSync(overridesPath, "utf8")) as { overrides?: Record<string, number> };
    return parsed.overrides ?? {};
  } catch {
    return {} as Record<string, number>;
  }
}

type SiteCache = { stamp: string; data: OrbitSiteConfig };
let siteCache: SiteCache | null = null;

export function liveSiteConfig(): OrbitSiteConfig {
  const mark = existsSync(configPath) ? String(statSync(configPath).mtimeMs) : "0";
  if (siteCache?.stamp === mark) return siteCache.data;
  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8")) as OrbitSiteConfig;
    const data = mergeSiteConfig(parsed);
    siteCache = { stamp: mark, data };
    return data;
  } catch {
    const data = mergeSiteConfig({} as OrbitSiteConfig);
    siteCache = { stamp: mark, data };
    return data;
  }
}

function priceFor(service: PricingService, overrides: Record<string, number>, markup: number) {
  let rate = overrides[String(service.id)] ?? service.ratePer1000;
  if (markup) rate *= 1 + markup / 100;
  return Math.round(rate * 10000) / 10000;
}

export function livePricingData(): ServicePricingData {
  const mark = stamp();
  if (cache?.stamp === mark) return cache.data;
  const admin = readServiceAdminSync();
  const overrides = readOverrides();
  const markup = liveSiteConfig().pricing?.globalMarkupPercent ?? 0;
  const inactive = new Set(admin.categories.filter((category) => !category.active).map((category) => category.name));
  const services: PricingService[] = [];
  const upstream = readUpstreamCatalogSync().services;

  if (!upstream.length) {
    for (const service of base.services) {
      if (admin.hiddenIds.includes(service.id)) continue;
      const patch = admin.patches[String(service.id)] ?? {};
      const group = admin.groupAlias[String(patch.group ?? service.group)] ?? patch.group ?? admin.groupAlias[service.group] ?? service.group;
      if (inactive.has(group)) continue;
      const next = { ...service, ...patch, group, id: service.id };
      next.ratePer1000 = priceFor(next, overrides, markup);
      services.push(next);
    }
  }

  for (const service of admin.custom) {
    if (!service.active || admin.hiddenIds.includes(service.id) || inactive.has(service.group)) continue;
    services.push({ ...service, ratePer1000: priceFor(service, overrides, markup) });
  }

  for (const row of upstream) {
    if (admin.hiddenIds.includes(row.localId) || inactive.has(row.category)) continue;
    if (services.some((service) => service.id === row.localId)) continue;
    /*
     * A Server API row already carries the price set in Service API, including its markup.
     * Applying the site markup again would charge the customer twice.
     */
    const priced = upstreamAsPricing(row);
    priced.ratePer1000 = Math.round(row.ratePer1000 * 10000) / 10000;
    services.push(priced);
  }

  const site = liveSiteConfig();
  const platformIds = sortPlatformIds(
    [...new Set(services.map((service) => service.platform))],
    site.pricing.platformOrder,
  );
  const groups = [...new Set(services.map((service) => service.group))].sort((a, b) => a.localeCompare(b));
  const data: ServicePricingData = {
    ...base,
    services,
    groups,
    platforms: platformIds,
    platformLabel: mergePlatformLabels(base.platformLabel, site.pricing.platformLabels),
    serviceCount: services.length,
  };
  cache = { stamp: mark, data };
  return data;
}

export function clearLiveCatalogCache() {
  cache = null;
}
