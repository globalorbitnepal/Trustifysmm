import Link from "next/link";
import { Header } from "@/components/Header";
import { NeonWaves } from "@/components/NeonWaves";
import { OrbitCluster } from "@/components/OrbitCluster";

export default function HomePage() {
  return (
    <main className="hero-shell">
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
            <span className="nowrap">Social Media Faster</span>
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
      <div className="waves top-left" aria-hidden>
        <svg viewBox="0 0 400 240" fill="none">
          <path
            d="M-20 160C40 40 90 20 140 70C190 120 150 210 230 190C310 170 300 40 420 80"
            stroke="url(#tl)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="tl" x1="0" y1="0" x2="400" y2="0">
              <stop stopColor="#e879f9" />
              <stop offset="1" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
        </svg>
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c4 2 7 7 7 12-3 0-6.2.6-9 2.2C7.2 14.2 6 9.8 12 3z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="14" cy="9" r="1.3" fill="currentColor" />
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
