import type { Metadata } from "next";
import Link from "next/link";
import { ALL_LANDING_PAGES, LANDING_GROUPS } from "@/lib/seo/pages";
import {
  breadcrumbJsonLd,
  buildMetadata,
  itemListJsonLd,
  jsonLdBlocks,
  webPageJsonLd,
} from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  path: "/social-media-services",
  title: "All Social Media Services & SMM Panel Guides | TrustifySMM",
  description:
    "Browse every TrustifySMM service page in one place: SMM panel guides plus Instagram, Facebook, TikTok, YouTube, Telegram, X, Spotify, LinkedIn and Twitch services.",
});

export const revalidate = 3600;

export default function ServicesHubPage() {
  const blocks = jsonLdBlocks([
    webPageJsonLd({
      path: "/social-media-services",
      name: "All social media services and SMM panel guides",
      description:
        "Index of every public TrustifySMM service page, grouped by SMM panel topics and platform.",
      breadcrumb: [
        { name: "Home", path: "/" },
        { name: "Social media services", path: "/social-media-services" },
      ],
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Social media services", path: "/social-media-services" },
    ]),
    itemListJsonLd({
      path: "/social-media-services",
      name: "TrustifySMM service pages",
      items: ALL_LANDING_PAGES.map((page) => ({ name: page.breadcrumbLabel, url: `/${page.slug}` })),
    }),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blocks) }} />
      <main className="page">
        <div className="seo-hub">
          <header className="seo-hub-head">
            <p className="services-page-badge">
              <span className="seo-badge-dot" aria-hidden />
              Service index
            </p>
            <h1>
              Every TrustifySMM service <span className="grad">in one place</span>
            </h1>
            <p>
              TrustifySMM runs one catalog across Instagram, Facebook, TikTok, YouTube, Telegram, X, Spotify, LinkedIn,
              Twitch and more. The pages below explain each service group, the current rate range per 1,000 units, how
              delivery works and what to check before ordering.
            </p>
            <div className="services-page-hero-actions">
              <Link className="btn btn-primary btn-lg" href="/services">
                Browse the live catalog
              </Link>
              <Link className="btn btn-ghost btn-lg" href="/pricing">
                Compare rates
              </Link>
            </div>
          </header>

          {LANDING_GROUPS.map((group) => {
            const pages = ALL_LANDING_PAGES.filter((page) => group.slugs.includes(page.slug));
            if (!pages.length) return null;
            return (
              <section className="seo-hub-group" key={group.id} aria-labelledby={`hub-${group.id}`}>
                <h2 id={`hub-${group.id}`}>{group.label}</h2>
                <ul className="seo-hub-list">
                  {pages.map((page) => (
                    <li key={page.slug}>
                      <Link href={`/${page.slug}`}>
                        <strong>{page.breadcrumbLabel}</strong>
                        <span>{page.metaDescription.slice(0, 120)}…</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
