import type { Metadata } from "next";
import { ApiDocumentation } from "@/components/ApiDocumentation";
import { Footer } from "@/components/Footer";
import { HeroStat, HeroStatGrid, PublicPageHero } from "@/components/PublicPageHero";
import { SiteHeader } from "@/components/SiteHeader";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { pageExtras } from "@/lib/orbit/page-extras";
import { pageHero } from "@/lib/orbit/public-copy";
import { livePricingData } from "@/lib/orbit/live-catalog";

const apiMetadata: Metadata = {
  title: "API Documentation & Banker | TrustifySMM Panel",
  description:
    "Full SMM panel API: services, orders, balance, status, multi-status and Banker crypto top-up. Download long PHP client, cURL examples and integration guide.",
  alternates: { canonical: "/api" },
  keywords: [
    "SMM panel API",
    "TrustifySMM API",
    "PHP SMM API",
    "add balance API",
    "banker API SMM",
    "reseller API",
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/api", apiMetadata);
}

export default function ApiPage() {
  const apiBlocks = pageExtras("/api").body ?? [];
  const catalog = livePricingData();
  const hero = pageHero("/api", {
    badge: "Developer API",
    title: "Panel",
    titleAccent: "API & Banker",
    lede: "Connect your store or custom site: list 1,900+ services, add balance with crypto invoices, place orders, and track delivery — with a complete PHP kit you can download.",
    ctaPrimary: "Download PHP API",
    ctaPrimaryHref: "/downloads/trustifysmm-api-client.php",
    ctaSecondary: "Browse endpoints",
    ctaSecondaryHref: "#api-endpoints",
  });
  return (
    <main className="page">
      <SiteHeader />
      <section className="api-page public-page-band">
        <div className="api-page-inner public-page-inner">
          <PublicPageHero
            id="api-hero-title"
            badge={hero.badge}
            badgeIcon={<CodeIcon />}
            title={hero.title}
            titleAccent={hero.titleAccent}
            lede={hero.lede}
            heroImage={hero.heroImage}
            heroImageAlt={hero.heroImageAlt}
            primary={
              hero.ctaPrimary
                ? {
                    label: hero.ctaPrimary,
                    href: hero.ctaPrimaryHref || "/downloads/trustifysmm-api-client.php",
                    download: true,
                  }
                : undefined
            }
            secondary={
              hero.ctaSecondary
                ? { label: hero.ctaSecondary, href: hero.ctaSecondaryHref || "#api-endpoints" }
                : undefined
            }
          >
            <HeroStatGrid label="API highlights">
              <HeroStat value={`${catalog.serviceCount.toLocaleString()}+`} label="Services via API" />
              <HeroStat value="REST" label="Orders, balance & status" />
              <HeroStat value="Banker" label="Crypto invoice top-ups" />
            </HeroStatGrid>
          </PublicPageHero>

          <ApiDocumentation />
          {apiBlocks.length ? (
            <section className="api-extra-sections">
              {apiBlocks.map((block) => (
                <article key={block.heading}>
                  <h2>{block.heading}</h2>
                  <p>{block.text}</p>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </section>
      <Footer />
    </main>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 8 4 12l4 4M16 8l4 4-4 4M14 5l-4 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}