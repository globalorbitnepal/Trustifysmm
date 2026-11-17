import type { Metadata } from "next";
import Link from "next/link";
import { ApiDocumentation } from "@/components/ApiDocumentation";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { pageExtras } from "@/lib/orbit/page-extras";
import { pageHero } from "@/lib/orbit/public-copy";

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
      <section className="api-page">
        <div className="api-page-inner">
          <p className="services-page-badge">
            <CodeIcon />
            {hero.badge}
          </p>
          <h1 className="services-page-title">
            {hero.title} {hero.titleAccent ? <span className="grad">{hero.titleAccent}</span> : null}
          </h1>
          <p className="services-page-lede">{hero.lede}</p>
          {hero.heroImage ? <img src={hero.heroImage} alt={hero.heroImageAlt || ""} style={{ maxWidth: 420, width: "100%", borderRadius: 20, marginBottom: 16 }} /> : null}
          <div className="services-page-hero-actions">
            {hero.ctaPrimary ? (
              <a className="btn btn-primary btn-lg" href={hero.ctaPrimaryHref || "/downloads/trustifysmm-api-client.php"} download={hero.ctaPrimaryHref?.includes(".php")}>
                {hero.ctaPrimary}
                <Arrow />
              </a>
            ) : null}
            {hero.ctaSecondary ? (
              <Link className="btn btn-ghost btn-lg" href={hero.ctaSecondaryHref || "#api-endpoints"}>
                {hero.ctaSecondary}
              </Link>
            ) : null}
          </div>

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

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}