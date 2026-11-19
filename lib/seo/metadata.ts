import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  canonicalPath,
} from "@/lib/seo/site";

export type SeoInput = {
  path: string;
  title: string;
  description: string;
  /** Internal keyword map only — never rendered into meta keywords. */
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

/**
 * Builds a complete, self-consistent Metadata object so no page can ship with a
 * missing canonical, OG card or Twitter card.
 */
export function buildMetadata(input: SeoInput): Metadata {
  const path = canonicalPath(input.path);
  const url = absoluteUrl(path);
  const title = input.title;
  const description = input.description;
  const ogTitle = input.ogTitle || title;
  const ogDescription = input.ogDescription || description;
  const image = input.ogImage ? absoluteUrl(input.ogImage) : DEFAULT_OG_IMAGE.url;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: input.noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    openGraph: {
      type: input.type || "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: image, width: 1200, height: 630, alt: ogTitle }],
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime,
            authors: input.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: DEFAULT_TWITTER,
      title: ogTitle,
      description: ogDescription,
      images: [image],
    },
    other: {
      "og:image:secure_url": image,
    },
  };
}

/** Metadata for a page that must never be indexed (auth screens, aliases). */
export function noindexMetadata(title: string, path: string, description?: string): Metadata {
  return {
    ...buildMetadata({ path, title, description: description || title, noindex: true }),
    alternates: { canonical: undefined },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["Trustify SMM", "TrustifySMM Panel"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand/trustify-lockup.png`,
      width: 720,
      height: 193,
    },
    image: DEFAULT_OG_IMAGE.url,
    description:
      "TrustifySMM is a social media marketing panel offering Instagram, TikTok, YouTube, Facebook, Telegram and other platform services with a shared wallet and reseller API.",
    email: "support@trustifysmm.com",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@trustifysmm.com",
        availableLanguage: ["English"],
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/services?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  breadcrumb?: { name: string; path: string }[];
}) {
  const url = absoluteUrl(canonicalPath(input.path));
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "en",
    ...(input.breadcrumb?.length
      ? { breadcrumb: { "@id": `${url}#breadcrumb` } }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const last = items[items.length - 1];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(canonicalPath(last?.path || "/"))}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(canonicalPath(item.path)),
    })),
  };
}

export function faqJsonLd(faq: { q: string; a: string }[], path: string) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl(canonicalPath(path))}#faq`,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Service schema without invented offers, ratings or reviews. */
export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  areaServed?: string[];
  offers?: { lowPrice: number; highPrice: number; priceCurrency: string } | null;
}) {
  const url = absoluteUrl(canonicalPath(input.path));
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url,
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: (input.areaServed?.length ? input.areaServed : ["Worldwide"]).map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
    ...(input.offers
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: input.offers.priceCurrency,
            lowPrice: input.offers.lowPrice,
            highPrice: input.offers.highPrice,
            offerCount: undefined,
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
  };
}

export function itemListJsonLd(input: { path: string; name: string; items: { name: string; url: string }[] }) {
  if (!input.items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl(canonicalPath(input.path))}#services`,
    name: input.name,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  };
}

/** Renders JSON-LD blocks, skipping null entries so no empty schema ships. */
export function jsonLdBlocks(blocks: (object | null)[]) {
  return blocks.filter(Boolean) as object[];
}
