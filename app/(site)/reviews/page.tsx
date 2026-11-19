import type { Metadata } from "next";
import { SeoArticle } from "@/components/SeoArticle";
import { reviewsPage } from "@/lib/seo-long-pages";
import { metadataForPath } from "@/lib/orbit/page-meta";

const meta: Metadata = {
  title: "TrustifySMM Reviews | Reseller Panel Experience",
  description:
    "How to read TrustifySMM reviews: order speed, refill, wallet ledger and support with an order ID. What agencies should test before they resell.",
  keywords: ["trustifysmm reviews", "smm panel reviews", "best smm panel for resellers", "smm panel support", "smm panel reliability"],
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "TrustifySMM reviews for resellers",
    description: "What a useful panel review covers, and how to test it with a small order.",
    url: "/reviews",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/reviews", meta);
}

export default function ReviewsPage() {
  return (
    <main className="page">
      <SeoArticle id="reviews" canonicalPath="/reviews" {...reviewsPage} />
    </main>
  );
}
