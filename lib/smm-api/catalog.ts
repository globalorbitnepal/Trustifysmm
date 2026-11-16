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
    refill: /refill|365d|lifetime/i.test(s.name + s.description),
    cancel: true,
    dripfeed: false,
    description: s.description || "",
  }));
}

export function findPricingService(data: ServicePricingData, serviceId: number) {
  return data.services.find((s) => s.id === serviceId);
}