import siteConfigJson from "@/data/orbit/site-config.json";
import type { OrbitSiteConfig } from "@/lib/orbit/types";

export const defaultSiteConfig: OrbitSiteConfig = {
  updatedAt: new Date().toISOString(),
  home: {
    badge: "#1 SMM Panel for Resellers & Agencies",
    headlineLine1: "Grow Your",
    headlineLine2: "Social Media Faster",
    headlineLine3: "with",
    headlineBrand: "TrustifySMM",
    lede: "Reliable, affordable and fully automated SMM services to boost your presence on all major social media platforms.",
    primaryCta: "Create Free Account",
    secondaryCta: "Watch Demo",
  },
  whyFeatures: [],
  footerStats: [],
  pages: {},
  pricing: { globalMarkupPercent: 0, bannerNote: "" },
  banker: { payCurrency: "usdttrc20", demoAutoPay: false, upstreamApiUrl: "", notes: "" },
};

export function mergeSiteConfig(raw: OrbitSiteConfig): OrbitSiteConfig {
  const base = defaultSiteConfig;
  return {
    ...base,
    ...raw,
    home: { ...base.home, ...raw.home },
    pricing: { ...base.pricing, ...raw.pricing },
    banker: { ...base.banker, ...raw.banker },
    whyFeatures: raw.whyFeatures?.length ? raw.whyFeatures : base.whyFeatures,
    footerStats: raw.footerStats?.length ? raw.footerStats : base.footerStats,
    pages: { ...base.pages, ...raw.pages },
  };
}

export function getSiteConfigSync(): OrbitSiteConfig {
  return mergeSiteConfig(siteConfigJson as OrbitSiteConfig);
}