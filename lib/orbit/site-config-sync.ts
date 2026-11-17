import siteConfigJson from "@/data/orbit/site-config.json";
import type { OrbitSiteConfig } from "@/lib/orbit/types";
import { ORBIT_PAGES } from "@/lib/orbit/page-registry";

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
    primaryCtaHref: "/signup",
    secondaryCtaHref: "/#services",
    heroImage: "",
    heroImageAlt: "",
  },
  sectionCopy: {
    why: {
      badge: "Why Choose TrustifySMM",
      title: "Everything You Need in One",
      titleAccent: "SMM Panel",
      lede: "Fast, secure and affordable social media marketing services to grow your brand, audience and business.",
    },
    platforms: {
      badge: "Supported Platforms",
      title: "All Major Social Media",
      titleAccent: "Platforms",
      lede: "One panel for all your social media marketing needs. Get real and high-quality services across the world's leading platforms.",
    },
    how: {
      badge: "How It Works",
      title: "Get Started in Just",
      titleAccent: "4 Simple Steps",
      lede: "Start using TrustifySMM in minutes. It's fast, easy and fully automated.",
    },
    services: {
      badge: "Popular Services",
      title: "Most Popular",
      titleAccent: "SMM Services",
      lede: "Grow faster with our most in-demand social media services, trusted by thousands of users.",
    },
    payments: {
      badge: "Payment Methods",
      title: "Secure & Fast",
      titleAccent: "Payments",
      lede: "Add funds to your account instantly with supported cryptocurrencies.",
    },
    reviews: {
      badge: "Customer Reviews",
      title: "What Our Customers",
      titleAccent: "Say",
      lede: "Real feedback from our global users who trust TrustifySMM.",
    },
  },
  pageContent: Object.fromEntries(
    ORBIT_PAGES.map((page) => [
      page.path,
      {
        slug: page.slug,
        badge: "",
        title: "",
        titleAccent: "",
        lede: "",
      },
    ]),
  ),
  whyFeatures: [],
  footerStats: [],
  pages: {},
  pricing: { globalMarkupPercent: 0, bannerNote: "" },
  banker: { payCurrency: "usdttrc20", demoAutoPay: false, upstreamApiUrl: "", notes: "" },
  contact: {
    email: "support@trustifysmm.com",
    phone: "",
    whatsapp: "",
    telegram: "https://t.me",
  },
  header: {
    links: [
      { href: "/", label: "Home" },
      { href: "/services", label: "Services" },
      { href: "/pricing", label: "Pricing" },
      { href: "/api", label: "API" },
      { href: "/blogs", label: "Blogs" },
      { href: "/support", label: "Support" },
    ],
    signInLabel: "Sign In",
    signUpLabel: "Sign Up",
  },
  footerCopy: {
    blurb: "Premium growth from one panel",
    copyright: "TrustifySMM. All rights reserved.",
  },
  sections: {},
  sectionOrder: ["hero", "why", "platforms", "how", "services", "payments", "reviews"],
  customBlocks: [],
  seo: { titleTemplate: "%s", description: "", disallow: [] },
};

export function mergeSiteConfig(raw: OrbitSiteConfig): OrbitSiteConfig {
  const base = defaultSiteConfig;
  return {
    ...base,
    ...raw,
    home: { ...base.home, ...raw.home },
    sectionCopy: {
      why: { ...base.sectionCopy.why, ...raw.sectionCopy?.why },
      platforms: { ...base.sectionCopy.platforms, ...raw.sectionCopy?.platforms },
      how: { ...base.sectionCopy.how, ...raw.sectionCopy?.how },
      services: { ...base.sectionCopy.services, ...raw.sectionCopy?.services },
      payments: { ...base.sectionCopy.payments, ...raw.sectionCopy?.payments },
      reviews: { ...base.sectionCopy.reviews, ...raw.sectionCopy?.reviews },
    },
    pageContent: { ...base.pageContent, ...raw.pageContent },
    pricing: { ...base.pricing, ...raw.pricing },
    banker: { ...base.banker, ...raw.banker },
    contact: { ...base.contact, ...raw.contact },
    header: {
      ...base.header,
      ...raw.header,
      links: raw.header?.links?.length ? raw.header.links : base.header.links,
    },
    footerCopy: { ...base.footerCopy, ...raw.footerCopy },
    sections: { ...base.sections, ...raw.sections },
    sectionOrder: raw.sectionOrder?.length ? raw.sectionOrder : base.sectionOrder,
    customBlocks: raw.customBlocks ?? base.customBlocks,
    seo: { ...base.seo, ...raw.seo, disallow: raw.seo?.disallow ?? base.seo.disallow },
    whyFeatures: raw.whyFeatures?.length ? raw.whyFeatures : base.whyFeatures,
    footerStats: raw.footerStats?.length ? raw.footerStats : base.footerStats,
    pages: { ...base.pages, ...raw.pages },
  };
}

export function getSiteConfigSync(): OrbitSiteConfig {
  return mergeSiteConfig(siteConfigJson as unknown as OrbitSiteConfig);
}