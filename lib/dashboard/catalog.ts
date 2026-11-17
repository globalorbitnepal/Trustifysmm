import type { PricingService } from "@/data/service-pricing-types";
import { catalogPlatformRows } from "@/lib/catalog-platform-order";
import { livePricingData, liveSiteConfig } from "@/lib/orbit/live-catalog";

function catalog() {
  return livePricingData();
}

export function money(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function parseLimit(value: string) {
  const n = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : NaN;
}

export function chargeFor(service: PricingService, quantity: number) {
  return money((service.ratePer1000 * quantity) / 1000);
}

export function validTargetUrl(link: string) {
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function listPlatforms() {
  const data = catalog();
  const site = liveSiteConfig();
  return catalogPlatformRows(data, {
    order: site.pricing.platformOrder,
    labels: site.pricing.platformLabels,
  });
}

export function listGroups(platform?: string) {
  const groups = new Set<string>();
  for (const service of catalog().services) {
    if (platform && service.platform !== platform) continue;
    groups.add(service.group);
  }
  return [...groups].sort((a, b) => a.localeCompare(b));
}

export function findService(id: number) {
  return catalog().services.find((service) => service.id === id) ?? null;
}

export function searchServices(input: { platform?: string; group?: string; q?: string; limit?: number }) {
  const q = input.q?.trim().toLowerCase() ?? "";
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 60);
  const rows: PricingService[] = [];
  for (const service of catalog().services) {
    if (input.platform && service.platform !== input.platform) continue;
    if (input.group && service.group !== input.group) continue;
    if (q) {
      const hay = `${service.id} ${service.name} ${service.group} ${service.description}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }
    rows.push(service);
    if (rows.length >= limit) break;
  }
  return rows.map(publicService);
}

export function publicService(service: PricingService) {
  return {
    id: service.id,
    name: service.name,
    platform: service.platform,
    platformLabel: catalog().platformLabel[service.platform] || service.platform,
    group: service.group,
    description: service.description,
    ratePer1000: service.ratePer1000,
    min: parseLimit(service.minOrder),
    max: parseLimit(service.maxOrder),
    avgTime: service.avgTime || "",
    status: "active" as const,
    refill: /refill|365d|lifetime/i.test(`${service.name} ${service.description}`),
    cancel: true,
  };
}

export function servicesByIds(ids: number[]) {
  return ids.map((id) => findService(id)).filter((service): service is PricingService => Boolean(service)).map(publicService);
}
