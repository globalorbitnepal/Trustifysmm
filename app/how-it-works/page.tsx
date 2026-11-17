import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { SeoArticle } from "@/components/SeoArticle";
import { SiteHeader } from "@/components/SiteHeader";
import { howPage } from "@/lib/seo-long-pages";
import { metadataForPath } from "@/lib/orbit/page-meta";

const meta: Metadata = {
  title: "How TrustifySMM Works | Signup, Crypto Wallet, Orders",
  description:
    "Create a free TrustifySMM account, add crypto balance with Banker, place an SMM order, and track status. Optional REST API uses the same wallet.",
  keywords: ["how smm panel works", "trustifysmm tutorial", "smm panel signup", "crypto smm deposit", "place smm order"],
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How TrustifySMM works",
    description: "Four steps from free account to a tracked order.",
    url: "/how-it-works",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/how-it-works", meta);
}

export default function HowItWorksPage() {
  return (
    <main className="page">
      <SiteHeader />
      <SeoArticle id="how" canonicalPath="/how-it-works" {...howPage} />
      <Footer />
    </main>
  );
}
