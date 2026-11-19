import type { Metadata } from "next";
import { readSiteConfig } from "@/lib/orbit/site-config";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import type { SitePageMeta } from "@/lib/orbit/types";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl, canonicalPath } from "@/lib/seo/site";

function normaliseTitle(title: Metadata["title"] | SitePageMeta["title"] | undefined): string | undefined {
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title) return String(title.absolute);
  if (title && typeof title === "object" && "default" in title) return String(title.default);
  return undefined;
}

/**
 * Merges CMS overrides onto a page's fallback metadata and guarantees the fields Google
 * and social crawlers need (absolute canonical, OG image, Twitter card) are always present.
 */
function applyMeta(row: SitePageMeta | undefined, fallback: Metadata, template?: string): Metadata {
  const fallbackTitle = normaliseTitle(fallback.title);
  const rawTitle = normaliseTitle(row?.title) || fallbackTitle;
  const title =
    template && template !== "%s" && rawTitle ? template.replace("%s", rawTitle) : rawTitle;

  const description =
    row?.description ||
    (typeof fallback.description === "string" ? fallback.description : undefined) ||
    "";

  const fallbackCanonical = fallback.alternates?.canonical;
  const canonicalValue =
    row?.canonical ||
    (typeof fallbackCanonical === "string"
      ? fallbackCanonical
      : fallbackCanonical && "url" in fallbackCanonical
        ? String(fallbackCanonical.url)
        : undefined);

  const ogImage =
    row?.ogImage ||
    (fallback.openGraph?.images
      ? Array.isArray(fallback.openGraph.images)
        ? String((fallback.openGraph.images[0] as { url?: string })?.url || "") || undefined
        : undefined
      : undefined) ||
    DEFAULT_OG_IMAGE.url;

  const noindex = Boolean(row?.noindex);

  const merged: Metadata = {
    ...fallback,
    title: title ?? fallback.title,
    description,
    alternates: canonicalValue ? { canonical: canonicalValue } : fallback.alternates,
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : fallback.robots || {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
    openGraph: {
      ...(fallback.openGraph ?? {}),
      title: row?.ogTitle || title || undefined,
      description: row?.ogDescription || description,
      siteName: SITE_NAME,
      locale: fallback.openGraph?.locale || "en_US",
      url: canonicalValue ? absoluteUrl(canonicalPath(String(canonicalValue))) : fallback.openGraph?.url,
      images: [
        {
          url: absoluteUrl(ogImage),
          width: 1200,
          height: 630,
          alt: row?.ogTitle || title || SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      ...(fallback.twitter ?? {}),
      title: row?.ogTitle || title || undefined,
      description: row?.ogDescription || description,
      images: [absoluteUrl(ogImage)],
    },
  };

  // Meta keywords are not a ranking factor; they are not emitted even when the CMS stores them.
  delete merged.keywords;

  return merged;
}

export async function metadataForPath(path: string, fallback: Metadata): Promise<Metadata> {
  const config = await readSiteConfig();
  return applyMeta(config.pages[path], fallback, config.seo?.titleTemplate);
}

export function metadataForPathSync(path: string, fallback: Metadata): Metadata {
  const config = liveSiteConfig();
  return applyMeta(config.pages[path], fallback, config.seo?.titleTemplate);
}

export { SITE_URL };
