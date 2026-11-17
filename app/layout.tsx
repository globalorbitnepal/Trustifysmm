import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteNavProgress } from "@/components/SiteNavProgress";
import { TrafficBeacon } from "@/components/TrafficBeacon";
import { readRedirectsSync } from "@/lib/orbit/redirects";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TrustifySMM — Premium SMM Panel",
  description:
    "Power your social media growth with reliable, affordable and automated services across the platforms you love.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get("x-pathname");
  if (path) {
    const hit = readRedirectsSync().find((row) => row.from === path);
    if (hit) redirect(hit.to);
  }
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
