import Link from "next/link";
import { OrbitSidebarLogo } from "@/components/orbit/OrbitSidebarLogo";

export function OrbitBrandLogoLink({ theme, href = "/orbit", compact = false }: { theme: "light" | "dark"; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="ob-lockup" aria-label="TrustifySMM Orbit">
      <OrbitSidebarLogo theme={theme} compact={compact} />
    </Link>
  );
}