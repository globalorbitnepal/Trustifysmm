import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import "../seo-landing.css";

export const revalidate = 60;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
