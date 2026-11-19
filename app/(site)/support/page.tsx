import type { Metadata } from "next";
import { HeroStat, HeroStatGrid, PublicPageHero } from "@/components/PublicPageHero";
import { SupportPageContent } from "@/components/SupportPageContent";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { pageExtras } from "@/lib/orbit/page-extras";
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
  const extras = pageExtras("/support");
  const topics = extras.supportCategories ?? [];
  const allFaq = topics.flatMap((category) => category.items);
  const contact = liveSiteConfig().contact;
  const supportStats = extras.stats ?? [];
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
      <section className="support-page public-page-band">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(helpPageJsonLd) }} />

        <div className="support-page-inner public-page-inner">
          <PublicPageHero
            id="support-hero-title"
            title={hero.title}
            titleAccent={hero.titleAccent}
            lede={hero.lede}
            heroImage={hero.heroImage}
            heroImageAlt={hero.heroImageAlt}
            primary={
              hero.ctaPrimary ? { label: hero.ctaPrimary, href: hero.ctaPrimaryHref || "/signin" } : undefined
            }
            secondary={
              hero.ctaSecondary
                ? { label: hero.ctaSecondary, href: hero.ctaSecondaryHref || "#support-faq" }
                : undefined
            }
          >
            <div className="support-stats support-stats--contact" aria-label="Contact">
              <a href={`mailto:${contact.email}`} className="support-stat support-stat--link">
                <strong>{contact.email}</strong>
                <span>{supportStats[0]?.label || "Email · 4–12h reply"}</span>
              </a>
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="support-stat support-stat--link">
                  <strong>{contact.phone}</strong>
                  <span>Phone</span>
                </a>
              ) : null}
            </div>
            <HeroStatGrid label="Support highlights">
              <HeroStat value={supportStats[1]?.value || "24/7"} label={supportStats[1]?.label || "Docs & catalog online"} />
              <HeroStat value={`${allFaq.length}+`} label={supportStats[2]?.label || "Help articles"} />
              <HeroStat value={supportStats[3]?.value || "Order ID"} label={supportStats[3]?.label || "Required for tickets"} />
            </HeroStatGrid>
          </PublicPageHero>

          <SupportPageContent
            email={contact.email}
            phone={contact.phone}
            whatsapp={contact.whatsapp}
            categories={topics}
            channels={extras.supportChannels}
            quickLinks={extras.supportQuickLinks}
            faqTitle={extras.faq?.title}
            faqAccent={extras.faq?.titleAccent}
            faqLede={extras.faq?.lede}
          />
        </div>
      </section>
    </main>
  );
}