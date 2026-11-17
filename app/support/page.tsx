import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { SupportPageContent } from "@/components/SupportPageContent";
import { supportFaqCategories } from "@/data/support-faq";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { pageHero } from "@/lib/orbit/public-copy";

const supportMetadata: Metadata = {
  title: "Help Center & Support | TrustifySMM Panel",
  description:
    "24/7 TrustifySMM help center: long FAQ on orders, refills, crypto Banker top-ups, API keys, partials and account security. Email support and panel tickets.",
  keywords: [
    "trustifysmm support",
    "smm panel help",
    "smm panel faq",
    "smm order not completing",
    "smm api help",
    "smm panel refill",
  ],
  alternates: { canonical: "/support" },
  openGraph: {
    title: "TrustifySMM Help Center",
    description: "Premium support FAQ for orders, payments, API and refills.",
    url: "/support",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/support", supportMetadata);
}

export default function SupportPage() {
  const allFaq = supportFaqCategories.flatMap((c) => c.items);
  const contact = liveSiteConfig().contact;
  const hero = pageHero("/support", {
    badge: "Help Center",
    title: "Premium",
    titleAccent: "Support & FAQ",
    lede: "Long-form professional answers for orders, refills, crypto Banker balance, API automation and account security — plus direct contact options when you need a human.",
    ctaPrimary: "Open panel & ticket",
    ctaPrimaryHref: "/signin",
    ctaSecondary: "Jump to FAQ",
    ctaSecondaryHref: "#support-faq",
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const helpPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "TrustifySMM Help Center",
    description: supportMetadata.description,
    url: "https://trustifysmm.com/support",
  };

  return (
    <main className="page">
      <SiteHeader />
      <section className="support-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(helpPageJsonLd) }} />

        <div className="support-page-inner">
          <p className="services-page-badge">
            <LifebeltIcon />
            {hero.badge}
          </p>
          <h1 className="services-page-title">
            {hero.title} {hero.titleAccent ? <span className="grad">{hero.titleAccent}</span> : null}
          </h1>
          <p className="services-page-lede">{hero.lede}</p>
          {hero.heroImage ? <img src={hero.heroImage} alt={hero.heroImageAlt || ""} style={{ maxWidth: 420, width: "100%", borderRadius: 20, marginBottom: 16 }} /> : null}

          <div className="support-stats" aria-label="Support highlights">
            <a href={`mailto:${contact.email}`} className="support-stat support-stat--link">
              <strong>{contact.email}</strong>
              <span>Email · 4–12h reply</span>
            </a>
            {contact.phone ? (
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="support-stat support-stat--link">
                <strong>{contact.phone}</strong>
                <span>Phone</span>
              </a>
            ) : null}
            <div className="support-stat">
              <strong>24/7</strong>
              <span>Docs &amp; catalog online</span>
            </div>
            <div className="support-stat">
              <strong>{allFaq.length}+</strong>
              <span>Help articles</span>
            </div>
            <div className="support-stat">
              <strong>Order ID</strong>
              <span>Required for tickets</span>
            </div>
          </div>

          <div className="services-page-hero-actions">
            {hero.ctaPrimary ? (
              <Link className="btn btn-primary btn-lg" href={hero.ctaPrimaryHref || "/signin"}>
                {hero.ctaPrimary}
              </Link>
            ) : null}
            {hero.ctaSecondary ? (
              <a className="btn btn-ghost btn-lg" href={hero.ctaSecondaryHref || "#support-faq"}>
                {hero.ctaSecondary}
              </a>
            ) : null}
          </div>

          <SupportPageContent email={contact.email} phone={contact.phone} whatsapp={contact.whatsapp} />
        </div>
      </section>
      <Footer />
    </main>
  );
}

function LifebeltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 8.5c1.2-1.2 2.5-1.8 3.5-1.8s2.3.6 3.5 1.8M8.5 15.5c1.2 1.2 2.5 1.8 3.5 1.8s2.3-.6 3.5-1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 6v3M12 15v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}