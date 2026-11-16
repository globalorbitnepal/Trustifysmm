import type { Metadata } from "next";
import Link from "next/link";
import { ApiDocumentation } from "@/components/ApiDocumentation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { metadataForPath } from "@/lib/orbit/page-meta";

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
  return (
    <main className="page">
      <Header />
      <section className="api-page">
        <div className="api-page-inner">
          <p className="services-page-badge">
            <CodeIcon />
            Developer API
          </p>
          <h1 className="services-page-title">
            Panel <span className="grad">API</span> &amp; Banker
          </h1>
          <p className="services-page-lede">
            Connect your store or custom site: list 1,900+ services, add balance with crypto invoices, place orders,
            and track delivery — with a complete PHP kit you can download.
          </p>
          <div className="services-page-hero-actions">
            <a className="btn btn-primary btn-lg" href="/downloads/trustifysmm-api-client.php" download>
              Download PHP API
              <Arrow />
            </a>
            <Link className="btn btn-ghost btn-lg" href="#api-endpoints">
              Browse endpoints
            </Link>
          </div>

          <ApiDocumentation />
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