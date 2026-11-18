import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { HeroLogoField, SocialOrbit } from "@/components/SocialOrbit";
import { WhyChoose } from "@/components/WhyChoose";
import { SupportedPlatforms } from "@/components/SupportedPlatforms";
import { HowItWorks } from "@/components/HowItWorks";
import { PopularServices } from "@/components/PopularServices";
import { PaymentMethods } from "@/components/PaymentMethods";
import { CustomerReviews } from "@/components/CustomerReviews";
import { Footer } from "@/components/Footer";

const homeMetadata: Metadata = {
  title: "TrustifySMM · SMM Panel",
  description:
    "Grow your social media faster with TrustifySMM. Reliable, affordable, automated SMM services for Instagram, YouTube, TikTok, Facebook and more — crypto Banker top-ups and a reseller API.",
  keywords: ["smm panel", "TrustifySMM", "buy instagram followers", "smm reseller panel", "crypto smm panel"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Grow Your Social Media Faster with TrustifySMM",
    description:
      "Premium SMM panel for resellers and agencies. Instant orders, crypto deposits, and services across every major platform.",
    url: "/",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/", homeMetadata);
}

export default function HomePage() {
  const site = liveSiteConfig();
  const enabled = (id: string) => site.sections?.[id] !== false;
  return (
    <main className="page">
      <SiteHeader />
      {enabled("hero") ? (
      <section className="hero-band" aria-labelledby="hero-title">
        <HeroLogoField />
        <div className="hero">
          <div className="hero-copy">
            <p className="badge">
              <Bolt />
              {site.home.badge}
            </p>
            <h1 className="headline" id="hero-title">
              <span className="headline-line">
                <span>{site.home.headlineLine1}</span>
              </span>
              <span className="headline-line">
                <span>{site.home.headlineLine2}</span>
              </span>
              <span className="headline-line">
                <span>
                  {site.home.headlineLine3} <span className="grad">{site.home.headlineBrand}</span>
                </span>
              </span>
            </h1>
            <p className="lede">{site.home.lede}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary btn-lg" href={site.home.primaryCtaHref || "/signup"}>
                <Rocket />
                {site.home.primaryCta}
                <Arrow />
              </Link>
              <Link className="btn btn-ghost btn-lg" href={site.home.secondaryCtaHref || "/services"}>
                <Grid />
                {site.home.secondaryCta}
              </Link>
            </div>
          </div>
          {site.home.heroImage ? (
            <div className="hero-media" aria-hidden>
              <img src={site.home.heroImage} alt={site.home.heroImageAlt || "Homepage hero"} style={{ width: "100%", maxWidth: 420, borderRadius: 24 }} />
            </div>
          ) : (
            <SocialOrbit />
          )}
        </div>
        <svg className="ribbons" viewBox="0 0 1440 520" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="ribbon" x1="0" y1="0" x2="1440" y2="0">
              <stop stopColor="#7C3AED" stopOpacity="0" />
              <stop offset="0.2" stopColor="#C084FC" />
              <stop offset="0.55" stopColor="#818CF8" />
              <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-80%" width="140%" height="260%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          <path d="M-80 300C160 210 300 420 520 360C760 290 820 140 1060 180C1240 210 1340 340 1560 260" fill="none" stroke="url(#ribbon)" strokeWidth="26" strokeLinecap="round" filter="url(#glow)" opacity="0.85" />
          <path d="M-60 360C180 290 360 470 600 410C860 340 900 200 1140 230C1300 252 1400 360 1560 300" fill="none" stroke="url(#ribbon)" strokeWidth="8" strokeLinecap="round" opacity="0.55" />
        </svg>
      </section>
      ) : null}
      <div className="section-bridge" aria-hidden />
      {enabled("why") ? <WhyChoose /> : null}
      <div className="section-bridge" aria-hidden />
      {enabled("platforms") ? <SupportedPlatforms /> : null}
      <div className="section-bridge" aria-hidden />
      {enabled("how") ? <HowItWorks /> : null}
      <div className="section-bridge" aria-hidden />
      {enabled("services") ? <PopularServices /> : null}
      <div className="section-bridge" aria-hidden />
      {enabled("payments") ? <PaymentMethods /> : null}
      {enabled("reviews") ? <CustomerReviews /> : null}
      {site.customBlocks.filter((block) => block.enabled).map((block) => (
        <section key={block.id} className="section" style={{ padding: "72px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <h2>{block.heading}</h2>
            <p>{block.text}</p>
          </div>
        </section>
      ))}
      <Footer />
    </main>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bolt() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7.6 1.2 3.2 8h3.1L6.2 12.8 10.8 6H7.6L7.6 1.2Z" fill="currentColor" />
    </svg>
  );
}

function Rocket() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M9.2 2.2c2.2.4 3.8 1.8 4.6 4.1-1.6.2-3 .8-4.1 1.8L8.2 6.6c1-.9 1.6-2.1 1-4.4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.4 7.4 4.2 9.6c.4 1.2.2 2.2-.4 3 .8-.2 1.8-.4 3-.2l2.2-2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.6 12.6 3 14.2M6.2 13.2l-.4 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Grid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
