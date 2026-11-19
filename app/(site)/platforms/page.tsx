import type { Metadata } from "next";
import { SeoArticle } from "@/components/SeoArticle";
import { platformsPage } from "@/lib/seo-long-pages";
import { metadataForPath } from "@/lib/orbit/page-meta";

const meta: Metadata = {
  title: "Supported Social Platforms | TrustifySMM SMM Panel",
  description:
    "Instagram, YouTube, TikTok, Facebook, X, Telegram, WhatsApp, Snapchat, Threads, LinkedIn, Spotify and Pinterest services in one TrustifySMM reseller panel.",
  keywords: ["smm platforms", "instagram smm panel", "tiktok smm services", "youtube smm panel", "telegram members panel", "trustifysmm platforms"],
  alternates: { canonical: "/platforms" },
  openGraph: {
    title: "Every major platform on TrustifySMM",
    description: "One catalog for the social networks agencies actually resell.",
    url: "/platforms",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/platforms", meta);
}

export default function PlatformsPage() {
  return (
    <main className="page">
      <SeoArticle id="platforms" canonicalPath="/platforms" {...platformsPage} />
    </main>
  );
}
