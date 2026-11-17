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

export type PlatformCard = { id: string; name: string; services: string; iconUrl?: string };
export type HowStep = { num: string; title: string; text: string; tone: "violet" | "blue" };
export type HowPerk = { label: string };
export type CustomerReview = {
  name: string;
  country: string;
  flag: string;
  avatar: string;
  text: string;
  tone: "violet" | "blue";
};
export type PaymentCoin = { id: string; name: string; ticker: string; tone: "violet" | "blue" };
export type PaymentPerk = { label: string };

export type OrbitDashboardCopy = {
  welcomePrefix: string;
  welcomeName: string;
  welcomeLede: string;
  heroArt: string;
};

export type SiteBrandAssets = {
  publicLogo: string;
  orbitLogoLight: string;
  orbitLogoDark: string;
  orbitHeroArt: string;
};

export type FaqEntry = { q: string; a: string };

export type PageFaqSection = {
  badge: string;
  title: string;
  titleAccent: string;
  lede: string;
  items: FaqEntry[];
};

export type PageStat = { value: string; label: string };

export type PageBodyBlock = { heading: string; text: string };

export type AuthPageCopy = {
  badge: string;
  titlePrefix: string;
  titleAccent: string;
  lede: string;
  perks: { title: string; text: string }[];
  trust: PageStat[];
  cardTitle: string;
  cardTitleAccent: string;
  cardLede: string;
};

export type SupportTopic = {
  id: string;
  title: string;
  description: string;
  items: FaqEntry[];
};

export type SupportChannel = {
  id: string;
  title: string;
  detail: string;
  sla: string;
  href: string;
  action: string;
};

export type SupportQuickLink = { href: string; label: string; desc: string };

export type PageExtras = {
  faq?: PageFaqSection;
  stats?: PageStat[];
  body?: PageBodyBlock[];
  auth?: AuthPageCopy;
  supportCategories?: SupportTopic[];
  supportChannels?: SupportChannel[];
  supportQuickLinks?: SupportQuickLink[];
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
  pageExtras: Record<string, PageExtras>;
  whyFeatures: { title: string; text: string; tone: "violet" | "blue" }[];
  footerStats: { value: string; label: string }[];
  platformCards: PlatformCard[];
  howSteps: HowStep[];
  howPerks: HowPerk[];
  customerReviews: CustomerReview[];
  paymentCoins: PaymentCoin[];
  paymentPerks: PaymentPerk[];
  orbitDashboard: OrbitDashboardCopy;
  brand: SiteBrandAssets;
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