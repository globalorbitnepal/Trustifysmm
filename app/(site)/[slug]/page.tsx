import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { livePricingData } from "@/lib/orbit/live-catalog";
import { priceRowsFor, startingPrice } from "@/lib/seo/landing-types";
import { landingBySlug, landingSlugs } from "@/lib/seo/pages";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqJsonLd,
  jsonLdBlocks,
  serviceJsonLd,
  webPageJsonLd,
} from "@/lib/seo/metadata";

type PageProps = { params: Promise<{ slug: string }> };

/** Pre-render every landing page at build time so no request pays for catalog work. */
export function generateStaticParams() {
  return landingSlugs().map((slug) => ({ slug }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = landingBySlug(slug);
  if (!page) return { title: "Page not found | TrustifySMM", robots: { index: false, follow: false } };
  return buildMetadata({
    path: `/${page.slug}`,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    ogImage: "/brand/og/trustifysmm-og.png",
  });
}

export default async function SeoLandingRoute({ params }: PageProps) {
  const { slug } = await params;
  const page = landingBySlug(slug);
  if (!page) notFound();

  const rows = priceRowsFor(livePricingData(), page.priceGroups);
  const lowest = startingPrice(rows);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: page.family === "panel" ? "SMM Panel" : "Services", path: page.family === "panel" ? "/smm-panel" : "/services" },
    { name: page.breadcrumbLabel, path: `/${page.slug}` },
  ];

  const blocks = jsonLdBlocks([
    webPageJsonLd({
      path: `/${page.slug}`,
      name: page.metaTitle,
      description: page.metaDescription,
      breadcrumb: crumbs,
    }),
    breadcrumbJsonLd(crumbs),
    serviceJsonLd({
      name: page.breadcrumbLabel,
      description: page.metaDescription,
      path: `/${page.slug}`,
      serviceType: "Social media marketing service",
      offers: lowest
        ? { lowPrice: Number(lowest.toFixed(4)), highPrice: Number(Math.max(...rows.map((row) => row.highest)).toFixed(4)), priceCurrency: "USD" }
        : null,
    }),
    faqJsonLd(page.faq, `/${page.slug}`),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blocks) }} />
      <SeoLandingPage page={page} priceRows={rows} />
    </>
  );
}
