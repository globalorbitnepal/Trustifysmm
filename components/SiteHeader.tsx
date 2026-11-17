import { Header } from "@/components/Header";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";

export function SiteHeader() {
  const site = liveSiteConfig();
  return (
    <Header
      logoSrc={site.brand?.publicLogo || "/brand/logo-header-clear.png"}
      links={site.header.links}
      signInLabel={site.header.signInLabel}
      signUpLabel={site.header.signUpLabel}
    />
  );
}
