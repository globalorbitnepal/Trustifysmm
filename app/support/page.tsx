import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SupportPageContent } from "@/components/SupportPageContent";
import { supportFaqCategories } from "@/data/support-faq";
import { metadataForPath } from "@/lib/orbit/page-meta";

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
      <Header />
      <section className="support-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(helpPageJsonLd) }} />

        <div className="support-page-inner">
          <p className="services-page-badge">
            <LifebeltIcon />
            Help Center
          </p>
          <h1 className="services-page-title">
            Premium <span className="grad">Support</span> &amp; FAQ
          </h1>
          <p className="services-page-lede">
            Long-form professional answers for orders, refills, crypto Banker balance, API automation and account
            security — plus direct contact options when you need a human.
          </p>

          <div className="support-stats" aria-label="Support highlights">
            <a href="mailto:support@trustifysmm.com" className="support-stat support-stat--link">
              <strong>support@trustifysmm.com</strong>
              <span>Email · 4–12h reply</span>
            </a>
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
            <Link className="btn btn-primary btn-lg" href="/signin">
              Open panel &amp; ticket
            </Link>
            <a className="btn btn-ghost btn-lg" href="#support-faq">
              Jump to FAQ
            </a>
          </div>

          <SupportPageContent />
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