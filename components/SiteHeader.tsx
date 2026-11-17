import { Header } from "@/components/Header";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";

export function SiteHeader() {
  const site = liveSiteConfig();
  return <Header links={site.header.links} signInLabel={site.header.signInLabel} signUpLabel={site.header.signUpLabel} />;
}
