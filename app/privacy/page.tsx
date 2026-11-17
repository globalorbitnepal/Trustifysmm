import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SeoArticle } from "@/components/SeoArticle";
import { SiteHeader } from "@/components/SiteHeader";
import { privacyPage } from "@/lib/seo-long-pages";
import { metadataForPath } from "@/lib/orbit/page-meta";

const meta: Metadata = {
  title: "Privacy Policy | TrustifySMM SMM Panel",
  description:
    "What TrustifySMM stores for accounts, orders, crypto invoices and support tickets, and what we do not sell. Cookies, sessions and retention.",
  keywords: ["trustifysmm privacy", "smm panel privacy policy", "smm panel data", "crypto payment privacy", "api key privacy"],
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "TrustifySMM Privacy Policy",
    description: "Account, order, payment and support data — what is stored and why.",
    url: "/privacy",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/privacy", meta);
}

export default function PrivacyPage() {
  return (
    <main className="page">
      <SiteHeader />
      <SeoArticle id="privacy" canonicalPath="/privacy" {...privacyPage} />
      <Footer />
    </main>
  );
}
