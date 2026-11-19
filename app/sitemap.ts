import type { MetadataRoute } from "next";
import { statSync } from "node:fs";
import path from "node:path";
import { getBlogSlugs } from "@/data/blog-utils";
import { publicManagedPosts } from "@/lib/orbit/blog-store";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { ALL_LANDING_PAGES } from "@/lib/seo/pages";
import { SITE_URL, canonicalPath, isPrivatePath } from "@/lib/seo/site";

/**
 * Real modification timestamps only. Falls back to the build's own file mtime rather
 * than inventing a date, so lastmod always reflects something that actually changed.
 */
function mtimeIso(...segments: string[]): string | undefined {
  for (const segment of segments) {
    try {
      return statSync(path.join(process.cwd(), segment)).mtime.toISOString();
    } catch {
      /* try the next candidate */
    }
  }
  return undefined;
}

const SITE_CONFIG_STAMP = () => mtimeIso("data/orbit/site-config.json");

/**
 * Only public, canonical, indexable URLs belong here. Anything noindexed in the
 * CMS, any private route and any duplicate is filtered out by construction.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const config = liveSiteConfig();
  const pageMeta = config.pages || {};
  const configStamp = SITE_CONFIG_STAMP();

  const core: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    source: string[];
  }[] = [
    { path: "/", priority: 1, changeFrequency: "daily", source: ["app/(site)/page.tsx"] },
    { path: "/services", priority: 0.9, changeFrequency: "daily", source: ["app/(site)/services/page.tsx"] },
    { path: "/pricing", priority: 0.9, changeFrequency: "daily", source: ["app/(site)/pricing/page.tsx"] },
    { path: "/social-media-services", priority: 0.8, changeFrequency: "weekly", source: ["lib/seo/pages.ts"] },
    { path: "/smm-panel", priority: 0.9, changeFrequency: "weekly", source: ["lib/seo/pages-panel.ts"] },
    { path: "/platforms", priority: 0.7, changeFrequency: "weekly", source: ["app/(site)/platforms/page.tsx"] },
    { path: "/how-it-works", priority: 0.7, changeFrequency: "weekly", source: ["app/(site)/how-it-works/page.tsx"] },
    { path: "/reviews", priority: 0.6, changeFrequency: "weekly", source: ["app/(site)/reviews/page.tsx"] },
    { path: "/api", priority: 0.7, changeFrequency: "monthly", source: ["app/(site)/api/page.tsx"] },
    { path: "/support", priority: 0.6, changeFrequency: "monthly", source: ["app/(site)/support/page.tsx"] },
    { path: "/blogs", priority: 0.7, changeFrequency: "daily", source: ["data/blog-posts.ts"] },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly", source: ["app/(site)/terms/page.tsx"] },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly", source: ["app/(site)/privacy/page.tsx"] },
  ];

  // /signin and /signup are deliberately absent: they are app entry points, not content.
  const coreEntries = core
    .filter((entry) => {
      if (isPrivatePath(entry.path)) return false;
      const meta = pageMeta[entry.path];
      if (meta?.noindex) return false;
      return true;
    })
    .map((entry) => ({
      url: `${SITE_URL}${canonicalPath(entry.path)}`,
      lastModified: mtimeIso(...entry.source) || configStamp,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    }));

  const landingStamp = mtimeIso(
    "lib/seo/pages-panel.ts",
    "lib/seo/pages-instagram.ts",
    "lib/seo/pages-facebook-tiktok.ts",
    "lib/seo/pages-youtube.ts",
    "lib/seo/pages-extra.ts",
  );

  const landingEntries = ALL_LANDING_PAGES.filter((page) => !pageMeta[`/${page.slug}`]?.noindex).map((page) => ({
    url: `${SITE_URL}/${page.slug}`,
    lastModified: landingStamp || configStamp,
    changeFrequency: "weekly" as const,
    priority: page.family === "panel" ? 0.8 : 0.7,
  }));

  const managed = new Map(publicManagedPosts().map((post) => [post.slug, post]));
  const blogEntries = [...new Set([...getBlogSlugs(), ...managed.keys()])].map((slug) => {
    const post = managed.get(slug);
    return {
      url: `${SITE_URL}/blogs/${slug}`,
      lastModified: post?.updatedAt ? new Date(post.updatedAt).toISOString() : mtimeIso("data/blog-posts.ts"),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  const seen = new Set<string>();
  return [...coreEntries, ...landingEntries, ...blogEntries].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

