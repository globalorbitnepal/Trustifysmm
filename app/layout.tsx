import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
    default: "TrustifySMM — Premium SMM Panel",
    template: "%s",
  },
  description:
    "Power your social media growth with reliable, affordable and automated services across the platforms you love.",
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

export const revalidate = 60;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={jakarta.variable}>
        <SiteNavProgress />
        <TrafficBeacon />
        {children}
      </body>
    </html>
  );
}
