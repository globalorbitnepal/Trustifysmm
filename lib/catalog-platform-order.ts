import { PRICING_PLATFORM_ORDER } from "@/data/service-pricing-types";
import type { ServicePricingData } from "@/data/service-pricing-types";

const DEFAULT_ORDER = PRICING_PLATFORM_ORDER.filter((id) => id !== "all");

export function sortPlatformIds(ids: string[], customOrder?: string[]): string[] {
  const order = customOrder?.length ? customOrder.filter((id) => id !== "all") : [...DEFAULT_ORDER];
  const rank = new Map<string, number>();
  for (let i = 0; i < order.length; i++) rank.set(order[i], i);
  const unique = [...new Set(ids.filter(Boolean))];
  const main = unique.filter((id) => id !== "other");
  const other = unique.filter((id) => id === "other");
  main.sort((a, b) => {
    const ra = rank.has(a) ? rank.get(a)! : 900;
    const rb = rank.has(b) ? rank.get(b)! : 900;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
  return [...main, ...other];
}

export function mergePlatformLabels(
  base: Record<string, string>,
  overrides?: Record<string, string>,
): Record<string, string> {
  if (!overrides || !Object.keys(overrides).length) return { ...base };
  return { ...base, ...overrides };
}

export function catalogPlatformRows(
  data: ServicePricingData,
  input?: { order?: string[]; labels?: Record<string, string> },
) {
  const labels = mergePlatformLabels(data.platformLabel, input?.labels);
  const ids = sortPlatformIds(data.platforms, input?.order);
  return ids.map((id) => ({ id, label: labels[id] || id }));
}

export function pricingPlatformTabs(
  data: ServicePricingData,
  input?: { order?: string[]; labels?: Record<string, string> },
) {
  const labels = mergePlatformLabels(data.platformLabel, input?.labels);
  const ids = sortPlatformIds(
    ["all", ...data.platforms],
    input?.order ? ["all", ...sortPlatformIds(data.platforms, input.order)] : undefined,
  );
  if (!ids.includes("all")) ids.unshift("all");
  return ids.map((id) => ({ id, label: id === "all" ? "All" : labels[id] ?? id }));
}