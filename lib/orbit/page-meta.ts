import type { Metadata } from "next";
import { readSiteConfig } from "@/lib/orbit/site-config";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import type { SitePageMeta } from "@/lib/orbit/types";

function applyMeta(row: SitePageMeta | undefined, fallback: Metadata, template?: string): Metadata {
  const titleText = typeof (row?.title || fallback.title) === "string" ? String(row?.title || fallback.title) : fallback.title;
  const title =
    template && template !== "%s" && typeof titleText === "string" ? template.replace("%s", titleText) : titleText;
  if (!row && (!template || template === "%s")) return fallback;
  return {
    ...fallback,
    title,
    description: row?.description || fallback.description,
    keywords: row?.focusKeywords || row?.keywords
      ? (row.focusKeywords || row.keywords).split(",").map((item) => item.trim()).filter(Boolean)
      : fallback.keywords,
    alternates: row?.canonical ? { canonical: row.canonical } : fallback.alternates,
    robots: row?.noindex ? { index: false, follow: true } : fallback.robots,
    openGraph: {
      ...(fallback.openGraph ?? {}),
      title: row?.ogTitle || (typeof title === "string" ? title : undefined),
      description: row?.ogDescription || row?.description || (typeof fallback.description === "string" ? fallback.description : undefined),
      images: row?.ogImage ? [row.ogImage] : fallback.openGraph?.images,
    },
  };
}

export async function metadataForPath(path: string, fallback: Metadata): Promise<Metadata> {
  const config = await readSiteConfig();
  return applyMeta(config.pages[path], fallback, config.seo?.titleTemplate);
}

export function metadataForPathSync(path: string, fallback: Metadata): Metadata {
  const config = liveSiteConfig();
  return applyMeta(config.pages[path], fallback, config.seo?.titleTemplate);
}