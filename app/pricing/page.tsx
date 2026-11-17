import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { PricingCatalog } from "@/components/PricingCatalog";
import { servicesFaq } from "@/data/services-faq";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { livePricingData, liveSiteConfig } from "@/lib/orbit/live-catalog";
import { pageHero } from "@/lib/orbit/public-copy";

const pricingMetadata: Metadata = {
  title: "SMM Panel Pricing — Service Rates per 1K | TrustifySMM",
  description:
    "Premium pricing cards for every SMM service. Compare rates per 1,000 units, min/max orders and delivery times. Search Instagram, TikTok, YouTube and more.",
  keywords: [
    "SMM panel pricing",
    "Instagram followers price",
    "TikTok views price",
    "cheap SMM rates",
    "TrustifySMM pricing",
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "TrustifySMM — SMM Panel Pricing",
    description: "Browse premium pricing cards for 1,900+ social media marketing services.",
    url: "/pricing",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/pricing", pricingMetadata);
}

const pageDescription =
  "Premium pricing cards for every SMM service. Compare rates per 1,000 units, min/max orders and delivery times.";

export default function PricingPage() {
  const hero = pageHero("/pricing", {
    badge: "Pricing",
    title: "Rate",
    titleAccent: "Deck — Compare Instantly",
    lede: "A pricing-first layout: glass platform rail, category accordions, and horizontal rate strips with bold per-1K numbers. Same catalog as Services — built for faster decisions.",
    ctaPrimary: "Create Account",
    ctaPrimaryHref: "/signup",
    ctaSecondary: "Full table catalog",
    ctaSecondaryHref: "/services",
  });
  const banner = liveSiteConfig().pricing.bannerNote;
  return (
    <main className="page">
      <SiteHeader />
      <section className="pricing-page" id="pricing">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "SMM Panel Pricing",
              description: pageDescription,
              url: "https://trustifysmm.com/pricing",
            }),
          }}
        />

        <div className="services-page-inner pricing-page-inner">
          <p className="services-page-badge">
            <StarIcon />
            {hero.badge}
          </p>
          <h1 className="pricing-page-title services-page-title">
            {hero.title} {hero.titleAccent ? <span className="grad">{hero.titleAccent}</span> : null}
          </h1>
          <p className="services-page-lede">{hero.lede}</p>
          {banner ? <p className="services-page-lede">{banner}</p> : null}
          {hero.heroImage ? <img src={hero.heroImage} alt={hero.heroImageAlt || ""} style={{ maxWidth: 420, width: "100%", borderRadius: 20, marginBottom: 16 }} /> : null}

          <div className="pricing-page-links">
            {hero.ctaPrimary ? (
              <Link className="btn btn-primary btn-lg" href={hero.ctaPrimaryHref || "/signup"}>
                {hero.ctaPrimary}
                <Arrow />
              </Link>
            ) : null}
            {hero.ctaSecondary ? (
              <Link className="btn btn-ghost btn-lg" href={hero.ctaSecondaryHref || "/services"}>
                {hero.ctaSecondary}
              </Link>
            ) : null}
          </div>

          <PricingCatalog data={livePricingData()} />
        </div>
      </section>

      <section className="pricing-page-faq services-faq" aria-labelledby="pricing-faq-title">
        <h2 id="pricing-faq-title" className="services-faq-title">
          Pricing <span className="grad">FAQ</span>
        </h2>
        <div className="services-faq-list">
          {servicesFaq.slice(0, 4).map((item) => (
            <details key={item.q} className="services-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

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