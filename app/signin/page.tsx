import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { SignInPageContent } from "@/components/SignInPageContent";
import { metadataForPath } from "@/lib/orbit/page-meta";

const signinMetadata: Metadata = {
  title: "Sign In | TrustifySMM SMM Panel",
  description:
    "Sign in to your TrustifySMM reseller panel — manage orders, Banker crypto balance, API keys and tickets. Secure access for agencies and shops.",
  keywords: [
    "trustifysmm login",
    "smm panel sign in",
    "smm panel dashboard",
    "trustifysmm panel access",
  ],
  alternates: { canonical: "/signin" },
  openGraph: {
    title: "Sign In to TrustifySMM",
    description: "Premium panel access for orders, balance, API and support.",
    url: "/signin",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataForPath("/signin", signinMetadata);
}

export default function SignInPage() {
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "TrustifySMM Panel Sign In",
    description: signinMetadata.description,
    url: "https://trustifysmm.com/signin",
  };

  return (
    <main className="page">
      <SiteHeader />
      <section className="auth-signup">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
        <div className="auth-signup-inner">
          <Suspense fallback={<div className="auth-signup-card" />}>
            <SignInPageContent />
          </Suspense>
        </div>
      </section>
      <Footer />
    </main>
  );
}