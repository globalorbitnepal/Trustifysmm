import Link from "next/link";

const spots = [
  { href: "/", label: "Home", left: "2%", top: "3.5%", width: "18%", height: "10%" },
  { href: "/", label: "Home page", left: "31.5%", top: "3.8%", width: "6.2%", height: "8.5%" },
  { href: "/#services", label: "Services", left: "38.2%", top: "3.8%", width: "8%", height: "8.5%" },
  { href: "/pricing", label: "Pricing", left: "46.4%", top: "3.8%", width: "6.2%", height: "8.5%" },
  { href: "/api", label: "API", left: "52.8%", top: "3.8%", width: "4.6%", height: "8.5%" },
  { href: "/blogs", label: "Blogs", left: "57.6%", top: "3.8%", width: "5.2%", height: "8.5%" },
  { href: "/support", label: "Support", left: "63%", top: "3.8%", width: "6.6%", height: "8.5%" },
  { href: "/signin", label: "Sign In", left: "77.6%", top: "3.5%", width: "9%", height: "9.5%" },
  { href: "/signup", label: "Sign Up", left: "87%", top: "3.5%", width: "10.4%", height: "9.5%" },
  { href: "/signup", label: "Create Free Account", left: "4.6%", top: "71.5%", width: "21.5%", height: "10.5%" },
  { href: "/#demo", label: "Watch Demo", left: "26.6%", top: "71.5%", width: "14.5%", height: "10.5%" },
] as const;

export function ExactHero() {
  return (
    <section className="exact-hero">
      <img
        className="exact-hero-art"
        src="/brand/hero-banner-exact.png"
        width={2560}
        height={1280}
        alt="TrustifySMM — Grow Your Social Media Faster. #1 SMM Panel for Resellers and Agencies."
      />
      <nav className="exact-hotspots" aria-label="Banner links">
        {spots.map((spot) => (
          <Link
            key={`${spot.label}-${spot.left}`}
            href={spot.href}
            aria-label={spot.label}
            style={{
              left: spot.left,
              top: spot.top,
              width: spot.width,
              height: spot.height,
            }}
          />
        ))}
      </nav>
    </section>
  );
}
