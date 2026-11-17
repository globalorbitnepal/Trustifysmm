import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import type { PageHeroContent, SectionHeading } from "@/lib/orbit/types";

const sectionDefaults: Record<string, SectionHeading> = {
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
};

export function sectionHeading(id: keyof typeof sectionDefaults): SectionHeading {
  const site = liveSiteConfig();
  const row = site.sectionCopy?.[id as keyof typeof site.sectionCopy];
  return { ...sectionDefaults[id], ...(row ?? {}) };
}

export function pageHero(path: string, fallback: PageHeroContent = {}): Required<Pick<PageHeroContent, "badge" | "title" | "lede">> &
  PageHeroContent {
  const site = liveSiteConfig();
  const row = site.pageContent?.[path] ?? {};
  return {
    badge: row.badge ?? fallback.badge ?? "",
    title: row.title ?? fallback.title ?? "",
    titleAccent: row.titleAccent ?? fallback.titleAccent,
    lede: row.lede ?? fallback.lede ?? "",
    ctaPrimary: row.ctaPrimary ?? fallback.ctaPrimary,
    ctaSecondary: row.ctaSecondary ?? fallback.ctaSecondary,
    ctaPrimaryHref: row.ctaPrimaryHref ?? fallback.ctaPrimaryHref,
    ctaSecondaryHref: row.ctaSecondaryHref ?? fallback.ctaSecondaryHref,
    heroImage: row.heroImage ?? fallback.heroImage,
    heroImageAlt: row.heroImageAlt ?? fallback.heroImageAlt,
  };
}