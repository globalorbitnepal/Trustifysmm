export type SitePageMeta = {
  title: string;
  description: string;
  keywords: string;
  focusKeywords?: string;
  tags?: string;
  slug?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
};

export type PageHeroContent = {
  badge?: string;
  title?: string;
  titleAccent?: string;
  lede?: string;
  ctaPrimary?: string;
  ctaPrimaryHref?: string;
  ctaSecondary?: string;
  ctaSecondaryHref?: string;
  heroImage?: string;
  heroImageAlt?: string;
};

export type SectionHeading = {
  badge: string;
  title: string;
  titleAccent?: string;
  lede: string;
};

export type SiteNavLink = { href: string; label: string };

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
    primaryCtaHref?: string;
    secondaryCtaHref?: string;
    heroImage?: string;
    heroImageAlt?: string;
  };
  sectionCopy: {
    why: SectionHeading;
    platforms: SectionHeading;
    how: SectionHeading;
    services: SectionHeading;
    payments: SectionHeading;
    reviews: SectionHeading;
  };
  pageContent: Record<string, PageHeroContent>;
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
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    telegram: string;
  };
  header: {
    links: SiteNavLink[];
    signInLabel: string;
    signUpLabel: string;
  };
  footerCopy: {
    blurb: string;
    copyright: string;
  };
  sections: Record<string, boolean>;
  sectionOrder: string[];
  customBlocks: { id: string; heading: string; text: string; enabled: boolean }[];
  seo: {
    titleTemplate: string;
    description: string;
    disallow: string[];
  };
};