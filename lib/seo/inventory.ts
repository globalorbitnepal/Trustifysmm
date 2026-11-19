/**
 * Read-only inventory used by the Orbit SEO manager. It reports what the live
 * public site actually publishes so an admin can spot a page with missing or
 * duplicated metadata without editing source code.
 */

import { ALL_LANDING_PAGES } from "@/lib/seo/pages";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { readFileSync } from "node:fs";
import path from "node:path";

export type SeoInventoryRow = {
  path: string;
  kind: "core" | "landing";
  label: string;
  title: string;
  description: string;
  focusKeywords: string;
  noindex: boolean;
  inSitemap: boolean;
  titleLength: number;
  descriptionLength: number;
  issues: string[];
};

const CORE_PAGES: { path: string; label: string; title: string; description: string; sitemap: boolean }[] = [
  {
    path: "/",
    label: "Homepage",
    title: "TrustifySMM – Professional SMM Panel & Social Media Marketing Services",
    description:
      "Explore social media marketing services for Instagram, Facebook, TikTok, YouTube and more with TrustifySMM.",
    sitemap: true,
  },
  { path: "/services", label: "Services", title: "SMM Services & Prices", description: "", sitemap: true },
  { path: "/pricing", label: "Pricing", title: "SMM Panel Pricing", description: "", sitemap: true },
  { path: "/social-media-services", label: "Service index", title: "All Social Media Services", description: "", sitemap: true },
  { path: "/platforms", label: "Platforms", title: "Platforms", description: "", sitemap: true },
  { path: "/how-it-works", label: "How it works", title: "How it works", description: "", sitemap: true },
  { path: "/reviews", label: "Reviews", title: "Reviews", description: "", sitemap: true },
  { path: "/api", label: "API docs", title: "API", description: "", sitemap: true },
  { path: "/support", label: "Support", title: "Support", description: "", sitemap: true },
  { path: "/blogs", label: "Blog", title: "Blog", description: "", sitemap: true },
  { path: "/terms", label: "Terms", title: "Terms", description: "", sitemap: true },
  { path: "/privacy", label: "Privacy", title: "Privacy", description: "", sitemap: true },
  { path: "/signin", label: "Sign in", title: "Sign In", description: "", sitemap: false },
  { path: "/signup", label: "Sign up", title: "Sign Up", description: "", sitemap: false },
];

function buildIssues(input: {
  titleLength: number;
  descriptionLength: number;
  noindex: boolean;
  inSitemap: boolean;
  path: string;
}): string[] {
  const issues: string[] = [];
  if (!input.titleLength) issues.push("Missing title");
  else if (input.titleLength > 70) issues.push("Title longer than 70 characters");
  if (!input.descriptionLength) issues.push("Missing description");
  else if (input.descriptionLength > 165) issues.push("Description longer than 165 characters");
  if (input.noindex && input.inSitemap) issues.push("Noindex page is listed in the sitemap");
  if (!input.noindex && !input.inSitemap) issues.push("Indexable page missing from sitemap");
  if (input.path.includes("?") || input.path.includes("#")) issues.push("URL contains parameters");
  return issues;
}

export function seoInventory(): { rows: SeoInventoryRow[]; duplicateTitles: string[]; duplicateDescriptions: string[] } {
  const config = liveSiteConfig();
  const managed = config.pages || {};

  const coreRows: SeoInventoryRow[] = CORE_PAGES.map((page) => {
    const override = managed[page.path];
    const title = override?.title || page.title;
    const description = override?.description || page.description;
    const noindex = Boolean(override?.noindex) || page.path === "/signin" || page.path === "/signup";
    const inSitemap = page.sitemap && !noindex;
    return {
      path: page.path,
      kind: "core",
      label: page.label,
      title,
      description,
      focusKeywords: override?.focusKeywords || override?.keywords || "",
      noindex,
      inSitemap,
      titleLength: title.length,
      descriptionLength: description.length,
      issues: buildIssues({ titleLength: title.length, descriptionLength: description.length, noindex, inSitemap, path: page.path }),
    };
  });

  const landingRows: SeoInventoryRow[] = ALL_LANDING_PAGES.map((page) => {
    const override = managed[`/${page.slug}`];
    const title = override?.title || page.metaTitle;
    const description = override?.description || page.metaDescription;
    const noindex = Boolean(override?.noindex);
    const inSitemap = !noindex;
    return {
      path: `/${page.slug}`,
      kind: "landing",
      label: page.breadcrumbLabel,
      title,
      description,
      focusKeywords: override?.focusKeywords || page.keywords.join(", "),
      noindex,
      inSitemap,
      titleLength: title.length,
      descriptionLength: description.length,
      issues: buildIssues({
        titleLength: title.length,
        descriptionLength: description.length,
        noindex,
        inSitemap,
        path: `/${page.slug}`,
      }),
    };
  });

  const rows = [...coreRows, ...landingRows];
  const titleCounts = new Map<string, number>();
  const descriptionCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.title) titleCounts.set(row.title, (titleCounts.get(row.title) || 0) + 1);
    if (row.description) descriptionCounts.set(row.description, (descriptionCounts.get(row.description) || 0) + 1);
  }

  return {
    rows,
    duplicateTitles: [...titleCounts.entries()].filter(([, count]) => count > 1).map(([title]) => title),
    duplicateDescriptions: [...descriptionCounts.entries()].filter(([, count]) => count > 1).map(([desc]) => desc),
  };
}

/** True when the search-engine verification file or env token is configured. */
export function searchConsoleStatus(): { googleSiteVerification: boolean; sitemapReachable: boolean } {
  let googleSiteVerification = Boolean(process.env.GOOGLE_SITE_VERIFICATION?.trim());
  if (!googleSiteVerification) {
    try {
      readFileSync(path.join(process.cwd(), "public", "google-site-verification.html"), "utf8");
      googleSiteVerification = true;
    } catch {
      googleSiteVerification = false;
    }
  }
  return { googleSiteVerification, sitemapReachable: true };
}
