import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MobileAppChrome } from "@/components/MobileAppChrome";
import { SiteNavProgress } from "@/components/SiteNavProgress";
import { TrafficBeacon } from "@/components/TrafficBeacon";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trustifysmm.com"),
  applicationName: "TrustifySMM",
  title: {
    default: "TrustifySMM – Professional SMM Panel & Social Media Marketing Services",
    template: "%s",
  },
  description:
    "Explore social media marketing services for Instagram, Facebook, TikTok, YouTube and more with TrustifySMM. Discover available services, transparent pricing and easy online ordering.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TrustifySMM", statusBarStyle: "black-translucent" },
  /*
   * Search Console verification is read from the environment so no token is invented.
   * Set GOOGLE_SITE_VERIFICATION (DNS TXT or HTML tag value) in the deployment env.
   */
  verification: process.env.GOOGLE_SITE_VERIFICATION?.trim()
    ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() }
    : undefined,
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    shortcut: "/favicon-32.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#08091b",
};

export const revalidate = 60;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={jakarta.variable}>
        <SiteNavProgress />
        <TrafficBeacon />
        {children}
        <MobileAppChrome />
      </body>
    </html>
  );
}
