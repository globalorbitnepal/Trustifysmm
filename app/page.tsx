import Link from "next/link";
import { ExactHero } from "@/components/ExactHero";
import { Header } from "@/components/Header";
import { NeonWaves } from "@/components/NeonWaves";
import { OrbitCluster } from "@/components/OrbitCluster";

export default function HomePage() {
  return (
    <main className="hero-shell">
      <ExactHero />

      <div className="hero-html">
        <Header />
        <section className="hero">
          <div>
            <div className="badge">
              <Lightning />
              #1 SMM Panel for Resellers & Agencies
            </div>
            <h1 className="headline">
              Grow Your
              <br />
              Social Media Faster
              <br />
              with <span className="grad">TrustifySMM</span>
            </h1>
            <p className="lede">
              Reliable, affordable and fully automated SMM services to boost your
              presence on all major social media platforms.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/signup">
                <Rocket /> Create Free Account <span aria-hidden>→</span>
              </Link>
              <Link className="btn btn-demo" href="/#demo">
                <Play /> Watch Demo
              </Link>
            </div>
          </div>
          <OrbitCluster />
        </section>
        <NeonWaves />
      </div>
    </main>
  );
}

function Lightning() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fde68a" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" />
    </svg>
  );
}

function Rocket() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.2 2.4c3.6 2.2 6.6 6.4 6.8 11.2-2.8-.1-5.7.6-8.4 2.2C8.4 12.2 8.6 7.4 12.2 2.4z" />
      <path d="M8 16.4c-.8 1.6-1.4 3.4-1.2 5.2 1.8.1 3.4-.8 4.8-1.8-.9-1.2-2.2-2.4-3.6-3.4z" opacity="0.85" />
    </svg>
  );
}

function Play() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 8.8v6.4L16 12 10 8.8z" />
    </svg>
  );
}
