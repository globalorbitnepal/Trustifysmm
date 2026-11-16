import pricingOverridesJson from "@/data/orbit/pricing-overrides.json";
import { getSiteConfigSync } from "@/lib/orbit/site-config-sync";
import type { PricingService, ServicePricingData } from "@/data/service-pricing-types";

export type PricingOverridesFile = {
  overrides: Record<string, number>;
};

let cachedOverrides: PricingOverridesFile | null = null;

export function getPricingOverridesSync(): PricingOverridesFile {
  if (cachedOverrides) return cachedOverrides;
  cachedOverrides = pricingOverridesJson as PricingOverridesFile;
  return cachedOverrides;
}

export function clearPricingOverridesCache() {
  cachedOverrides = null;
}

export function effectiveRatePer1000(service: PricingService): number {
  const file = getPricingOverridesSync();
  const config = getSiteConfigSync();
  const key = String(service.id);
  let rate = file.overrides[key] ?? service.ratePer1000;
  const markup = config.pricing?.globalMarkupPercent ?? 0;
  if (markup) rate = rate * (1 + markup / 100);
  return Math.round(rate * 10000) / 10000;
}

export function withEffectiveRates(services: PricingService[]): PricingService[] {
  return services.map((s) => ({
    ...s,
    ratePer1000: effectiveRatePer1000(s),
  }));
}

export function applyOrbitPricing(data: ServicePricingData): ServicePricingData {
  return { ...data, services: withEffectiveRates(data.services) };
}