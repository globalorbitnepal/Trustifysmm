import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { ServicesFaq } from "@/components/ServicesFaq";
import { ServicesPricingCatalog } from "@/components/ServicesPricingCatalog";
import { servicesFaq } from "@/data/services-faq";
import { livePricingData } from "@/lib/orbit/live-catalog";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { pageHero } from "@/lib/orbit/public-copy";

const servicesMetadata: Metadata = {
  title: "All SMM Services & Prices | TrustifySMM Panel",
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
    title: "All SMM Services & Prices | TrustifySMM",
    description: "Search and compare 1,900+ social media marketing services with transparent per-1K pricing.",
    url: "/services",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/services", servicesMetadata);
}

export default function ServicesPage() {
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
    mainEntity: servicesFaq.map((item) => ({
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
      <SiteHeader />
      <section className="services-page" id="all-services">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />

        <div className="services-page-inner">
          <p className="services-page-badge">
            <StarIcon />
            {hero.badge}
          </p>
          <h1 className="services-page-title">
            {hero.title} {hero.titleAccent ? <span className="grad">{hero.titleAccent}</span> : null}
          </h1>
          <p className="services-page-lede">{hero.lede}</p>
          {hero.heroImage ? <img src={hero.heroImage} alt={hero.heroImageAlt || ""} style={{ maxWidth: 420, width: "100%", borderRadius: 20, marginBottom: 16 }} /> : null}

          <div className="services-page-hero-actions">
            {hero.ctaPrimary ? (
              <Link className="btn btn-primary btn-lg" href={hero.ctaPrimaryHref || "/signup"}>
                {hero.ctaPrimary}
                <Arrow />
              </Link>
            ) : null}
            {hero.ctaSecondary ? (
              <Link className="btn btn-ghost btn-lg" href={hero.ctaSecondaryHref || "#services-faq"}>
                {hero.ctaSecondary}
              </Link>
            ) : null}
          </div>

          <ServicesPricingCatalog data={livePricingData()} />
        </div>
      </section>

      <ServicesFaq />
      <Footer />
    </main>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12 4.2 1.8 4.2 4.5.4-3.4 2.9 1 4.3L12 13.8l-4 2.2 1-4.3-3.4-2.9 4.5-.4L12 4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}