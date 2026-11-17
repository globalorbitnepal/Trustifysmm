import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { HeroStat, HeroStatGrid, PublicPageHero } from "@/components/PublicPageHero";
import { SiteHeader } from "@/components/SiteHeader";
import { PricingCatalog } from "@/components/PricingCatalog";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { livePricingData, liveSiteConfig } from "@/lib/orbit/live-catalog";
import { pageExtras } from "@/lib/orbit/page-extras";
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
  const catalog = livePricingData();
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
  const pricingFaq = pageExtras("/pricing").faq;
  return (
    <main className="page">
      <SiteHeader />
      <section className="pricing-page public-page-band" id="pricing">
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

        <div className="services-page-inner pricing-page-inner public-page-inner">
          <PublicPageHero
            id="pricing-hero-title"
            badge={hero.badge}
            badgeIcon={<StarIcon />}
            title={hero.title}
            titleAccent={hero.titleAccent}
            lede={hero.lede}
            extraLede={banner || undefined}
            heroImage={hero.heroImage}
            heroImageAlt={hero.heroImageAlt}
            titleClassName="pricing-page-title"
            primary={
              hero.ctaPrimary ? { label: hero.ctaPrimary, href: hero.ctaPrimaryHref || "/signup" } : undefined
            }
            secondary={
              hero.ctaSecondary
                ? { label: hero.ctaSecondary, href: hero.ctaSecondaryHref || "/services" }
                : undefined
            }
          >
            <HeroStatGrid label="Pricing highlights">
              <HeroStat value={`${catalog.serviceCount.toLocaleString()}+`} label="Services with live rates" />
              <HeroStat value="Per 1K" label="Bold USD on every card" />
              <HeroStat value="Instant" label="Order right after signup" />
            </HeroStatGrid>
          </PublicPageHero>

          <PricingCatalog data={catalog} />
        </div>
      </section>

      <section className="pricing-page-faq services-faq" aria-labelledby="pricing-faq-title">
        <h2 id="pricing-faq-title" className="services-faq-title">
          {pricingFaq?.title || "Pricing"}{" "}
          {pricingFaq?.titleAccent ? <span className="grad">{pricingFaq.titleAccent}</span> : null}
        </h2>
        {pricingFaq?.lede ? <p className="services-faq-lede">{pricingFaq.lede}</p> : null}
        <div className="services-faq-list">
          {(pricingFaq?.items ?? []).map((item) => (
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