import { PANEL_PAGES } from "@/lib/seo/pages-panel";
import { INSTAGRAM_PAGES } from "@/lib/seo/pages-instagram";
import { FACEBOOK_PAGES, TIKTOK_PAGES } from "@/lib/seo/pages-facebook-tiktok";
import { YOUTUBE_PAGES } from "@/lib/seo/pages-youtube";
import { EXTRA_PLATFORM_PAGES } from "@/lib/seo/pages-extra";
import type { SeoLanding } from "@/lib/seo/landing-types";

/** Every published SEO landing page, in navigation order. */
export const ALL_LANDING_PAGES: SeoLanding[] = [
  ...PANEL_PAGES,
  ...INSTAGRAM_PAGES,
  ...FACEBOOK_PAGES,
  ...TIKTOK_PAGES,
  ...YOUTUBE_PAGES,
  ...EXTRA_PLATFORM_PAGES,
];

const bySlug = new Map(ALL_LANDING_PAGES.map((page) => [page.slug, page]));

export function landingBySlug(slug: string): SeoLanding | undefined {
  return bySlug.get(slug);
}

export function landingSlugs(): string[] {
  return ALL_LANDING_PAGES.map((page) => page.slug);
}

export type LandingGroup = { id: string; label: string; slugs: string[] };

/** Grouping used by the footer, the hub page and internal linking blocks. */
export const LANDING_GROUPS: LandingGroup[] = [
  { id: "panel", label: "SMM panel", slugs: PANEL_PAGES.map((page) => page.slug) },
  { id: "instagram", label: "Instagram", slugs: INSTAGRAM_PAGES.map((page) => page.slug) },
  { id: "facebook", label: "Facebook", slugs: FACEBOOK_PAGES.map((page) => page.slug) },
  { id: "tiktok", label: "TikTok", slugs: TIKTOK_PAGES.map((page) => page.slug) },
  { id: "youtube", label: "YouTube", slugs: YOUTUBE_PAGES.map((page) => page.slug) },
  { id: "other", label: "More platforms", slugs: EXTRA_PLATFORM_PAGES.map((page) => page.slug) },
];

export function landingLabel(slug: string): string {
  const page = bySlug.get(slug);
  if (page) return page.breadcrumbLabel;
  return slug.replace(/-/g, " ");
}
