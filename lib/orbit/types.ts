export type SitePageMeta = {
  title: string;
  description: string;
  keywords: string;
};

export type OrbitSiteConfig = {
  updatedAt: string;
  home: {
    badge: string;
    headlineLine1: string;
    headlineLine2: string;
    headlineLine3: string;
    headlineBrand: string;
    lede: string;
    primaryCta: string;
    secondaryCta: string;
  };
  whyFeatures: { title: string; text: string; tone: "violet" | "blue" }[];
  footerStats: { value: string; label: string }[];
  pages: Record<string, SitePageMeta>;
  pricing: {
    globalMarkupPercent: number;
    bannerNote: string;
  };
  banker: {
    payCurrency: string;
    demoAutoPay: boolean;
    upstreamApiUrl: string;
    notes: string;
  };
};