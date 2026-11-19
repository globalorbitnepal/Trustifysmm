import type { Metadata } from "next";
import { SeoArticle } from "@/components/SeoArticle";
import { termsPage } from "@/lib/seo-long-pages";
import { metadataForPath } from "@/lib/orbit/page-meta";

const meta: Metadata = {
  title: "Terms of Service | TrustifySMM SMM Panel",
  description:
    "TrustifySMM terms for accounts, SMM orders, crypto wallet credits, refills, partials, cancellations and API use.",
  keywords: ["trustifysmm terms", "smm panel terms of service", "smm order policy", "smm refund policy", "smm api terms"],
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "TrustifySMM Terms of Service",
    description: "Account, order, wallet and API rules for the TrustifySMM panel.",
    url: "/terms",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/terms", meta);
}

export default function TermsPage() {
  return (
    <main className="page">
      <SeoArticle id="terms" canonicalPath="/terms" {...termsPage} />
    </main>
  );
}
