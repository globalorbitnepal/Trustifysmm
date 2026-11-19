import type { Metadata } from "next";
import { SignUpPageContent } from "@/components/SignUpPageContent";
import { metadataForPath } from "@/lib/orbit/page-meta";
import { authCopy } from "@/lib/orbit/page-extras";

const signupMetadata: Metadata = {
  title: "Create Free Account | TrustifySMM SMM Panel",
  description:
    "Sign up for TrustifySMM — 1,900+ SMM services, crypto Banker balance, REST API access and reseller-ready pricing. Free account, no signup fee.",
  keywords: [
    "smm panel signup",
    "create smm panel account",
    "trustifysmm register",
    "free smm panel",
    "smm reseller account",
  ],
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Create Free TrustifySMM Account",
    description: "Premium SMM panel signup — catalog, crypto top-ups and API in one place.",
    url: "/signup",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const resolved = await metadataForPath("/signup", signupMetadata);
  return { ...resolved, robots: { index: false, follow: false, nocache: true }, alternates: { canonical: undefined } };
}

export default function SignUpPage() {
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Create TrustifySMM Account",
    description: signupMetadata.description,
    url: "https://trustifysmm.com/signup",
  };

  return (
    <section className="auth-signup">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <div className="auth-signup-inner">
        <SignUpPageContent copy={authCopy("/signup")} />
      </div>
    </section>
  );
}