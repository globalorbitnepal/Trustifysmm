import type { PricingService, ServicePricingData } from "@/data/service-pricing-types";

export function formatRatePer1000(value: number) {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
}

export function filterPricingServices(
  data: ServicePricingData,
  opts: { query: string; platform: string; group: string },
) {
  const q = opts.query.trim().toLowerCase();
  return data.services.filter((s) => {
    if (opts.platform !== "all" && s.platform !== opts.platform) return false;
    if (opts.group !== "all" && s.group !== opts.group) return false;
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.group.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });
}

export function groupPricingServices(services: PricingService[]) {
  const map = new Map<string, PricingService[]>();
  for (const item of services) {
    const bucket = map.get(item.group) ?? [];
    bucket.push(item);
    map.set(item.group, bucket);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function minRate(services: PricingService[]) {
  if (services.length === 0) return 0;
  return Math.min(...services.map((s) => s.ratePer1000));
}

/** Uses orbit-adjusted ratePer1000 when services were passed through applyOrbitPricing */
export function minEffectiveRate(services: PricingService[]) {
  return minRate(services);
}

export function organizePlatformChapters(
  services: PricingService[],
  platformLabel: Record<string, string>,
  selectedPlatform: string,
) {
  const list =
    selectedPlatform === "all" ? services : services.filter((s) => s.platform === selectedPlatform);
  const byPlatform = new Map<string, PricingService[]>();
  for (const item of list) {
    const bucket = byPlatform.get(item.platform) ?? [];
    bucket.push(item);
    byPlatform.set(item.platform, bucket);
  }
  return [...byPlatform.entries()]
    .sort(([a], [b]) => (platformLabel[a] ?? a).localeCompare(platformLabel[b] ?? b))
    .map(([platform, items]) => ({
      platform,
      label: platformLabel[platform] ?? platform,
      from: minRate(items),
      count: items.length,
      groups: groupPricingServices(items),
    }));
}

export function groupsForPlatform(data: ServicePricingData, platform: string) {
  const list =
    platform === "all" ? data.services : data.services.filter((s) => s.platform === platform);
  return ["all", ...new Set(list.map((s) => s.group))].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
  );
}