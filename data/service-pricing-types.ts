export type PricingService = {
  id: number;
  name: string;
  category: string;
  platform: string;
  group: string;
  ratePer1000: number;
  minOrder: string;
  maxOrder: string;
  avgTime: string;
  description: string;
  /** True when the service supports refills. Set by the synced catalog. */
  refill?: boolean;
};

export type ServicePricingData = {
  services: PricingService[];
  groups: string[];
  platforms: string[];
  platformLabel: Record<string, string>;
  serviceCount: number;
  updatedAt?: string;
};

export const PRICING_PLATFORM_ORDER = [
  "all",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "telegram",
  "x",
  "threads",
  "whatsapp",
  "snapchat",
  "linkedin",
  "spotify",
  "pinterest",
  "other",
] as const;