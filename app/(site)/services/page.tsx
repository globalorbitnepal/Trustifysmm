import type { Metadata } from "next";
import { HeroStat, HeroStatGrid, PublicPageHero } from "@/components/PublicPageHero";
import { ServicesFaq } from "@/components/ServicesFaq";
import { ServicesPricingCatalog } from "@/components/ServicesPricingCatalog";
import { livePricingData } from "@/lib/orbit/live-catalog";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { pageExtras } from "@/lib/orbit/page-extras";
import { pageHero } from "@/lib/orbit/public-copy";

const servicesMetadata: Metadata = {
  title: "TrustifySMM · Services & Prices",
  description:
    "Browse 1,900+ SMM services with live USD rates per 1000. Search Instagram, TikTok, YouTube, Facebook, Telegram and more. Category filters, min/max orders and instant panel access.",
  keywords: [
    "SMM services list",
    "SMM panel prices",
    "buy Instagram followers",
    "TikTok SMM services",
    "YouTube subscribers price",
    "cheap SMM panel",
    "TrustifySMM services",
  ],
  alternates: { canonical: "/services" },
  openGraph: {
    title: "TrustifySMM · Services & Prices",
    description: "Search and compare 1,900+ social media marketing services with transparent per-1K pricing.",
    url: "/services",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/services", servicesMetadata);
}

export default function ServicesPage() {
  const catalog = livePricingData();
  const hero = pageHero("/services", {
    badge: "Services & Pricing",
    title: "All",
    titleAccent: "SMM Services & Rates",
    lede: "Long-form public catalog with live-style pricing per 1,000 units. Filter by platform or category, search by service ID, and order from the panel in seconds.",
    ctaPrimary: "Create Free Account",
    ctaPrimaryHref: "/signup",
    ctaSecondary: "Read FAQ",
    ctaSecondaryHref: "#services-faq",
  });
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (pageExtras("/services").faq?.items ?? []).map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "All SMM Services and Prices",
    description: servicesMetadata.description,
    url: "https://trustifysmm.com/services",
    isPartOf: { "@type": "WebSite", name: "TrustifySMM" },
  };

  return (
    <main className="page">
      <section className="services-page public-page-band" id="all-services">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />

        <div className="services-page-inner public-page-inner">
          <PublicPageHero
            id="services-hero-title"
            title={hero.title}
            titleAccent={hero.titleAccent}
            lede={hero.lede}
            heroImage={hero.heroImage}
            heroImageAlt={hero.heroImageAlt}
            primary={
              hero.ctaPrimary
                ? { label: hero.ctaPrimary, href: hero.ctaPrimaryHref || "/signup" }
                : undefined
            }
            secondary={
              hero.ctaSecondary
                ? { label: hero.ctaSecondary, href: hero.ctaSecondaryHref || "#services-faq" }
                : undefined
            }
          >
            <HeroStatGrid label="Catalog highlights">
              <HeroStat value={`${catalog.serviceCount.toLocaleString()}+`} label="Live services in catalog" />
              <HeroStat value={Math.max(0, catalog.platforms.length - 1)} label="Major platforms" />
              <HeroStat value="USD" label="Rates shown per 1,000 units" />
            </HeroStatGrid>
          </PublicPageHero>

          <ServicesPricingCatalog />
        </div>
      </section>

      <ServicesFaq />
    </main>
  );
}