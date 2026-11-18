import type { ServicePricingData } from "@/data/service-pricing-types";

export type ApiServiceRow = {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
  dripfeed: boolean;
  description: string;
};

export function pricingToApiServices(data: ServicePricingData): ApiServiceRow[] {
  return data.services.map((s) => ({
    service: s.id,
    name: s.name,
    type: "Default",
    category: s.group,
    rate: String(s.ratePer1000),
    min: s.minOrder || "1",
    max: s.maxOrder || "1000000",
    refill: Boolean(s.refill) || /refill|365d|lifetime/i.test(s.name + s.description),
    cancel: true,
    dripfeed: false,
    description: s.description || "",
  }));
}

export function findPricingService(data: ServicePricingData, serviceId: number) {
  return data.services.find((s) => s.id === serviceId);
}

/**
 * Charged amount for a reseller API order. Rounds up and never returns 0 for a real quantity,
 * so a cheap service at a small minimum cannot be ordered for free.
 */
export function panelChargeFor(ratePer1000: number, quantity: number) {
  const raw = (ratePer1000 * quantity) / 1000;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const units = Math.round(raw * 1e4 * 1e6) / 1e6;
  return Math.max(Math.ceil(units) / 1e4, 0.0001);
}