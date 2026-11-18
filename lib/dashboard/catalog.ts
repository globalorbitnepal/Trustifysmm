import type { PricingService } from "@/data/service-pricing-types";
import { catalogPlatformRows } from "@/lib/catalog-platform-order";
import { livePricingData, liveSiteConfig } from "@/lib/orbit/live-catalog";

function catalog() {
  return livePricingData();
}

export function money(value: number) {
  return Math.round(value * 10000) / 10000;
}

/**
 * Charge for a quantity, never rounding a real order down to nothing.
 * A cheap service with a small minimum would otherwise round to $0.0000 and let a customer
 * take delivery for free, so a positive quantity always costs at least one ten-thousandth.
 */
export function chargeFor(service: PricingService, quantity: number) {
  const raw = (service.ratePer1000 * quantity) / 1000;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  /*
   * Work in ten-thousandths. The multiplication by 1e4 is rounded first so binary float noise
   * (0.19470000000000002) cannot push an exact price up by one unit; ceil then guarantees the
   * charge never falls below the real cost. 0.0001 is the smallest charge for a live order.
   */
  const units = Math.round(raw * 1e4 * 1e6) / 1e6;
  return Math.max(Math.ceil(units) / 1e4, 0.0001);
}

export function parseLimit(value: string) {
  const n = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : NaN;
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
  const limit = Math.min(Math.max(input.limit ?? 40, 1), 2000);
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
    refill: service.refill ?? /refill|365d|lifetime/i.test(`${service.name} ${service.description}`),
    cancel: true,
  };
}

export function servicesByIds(ids: number[]) {
  return ids.map((id) => findService(id)).filter((service): service is PricingService => Boolean(service)).map(publicService);
}
