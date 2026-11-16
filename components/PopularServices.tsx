import Link from "next/link";
import { popularServices } from "@/data/services";
import { ServiceCatalogGrid } from "@/components/ServiceCatalogGrid";

export function PopularServices() {
  return (
    <section className="popular" id="services-list">
      <svg className="popular-waves" viewBox="0 0 1440 700" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="pop-wave" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#A855F7" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <filter id="pop-glow">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <path
          d="M-140 120C120 40 300 180 560 100C840 10 980 90 1260 60"
          fill="none"
          stroke="url(#pop-wave)"
          strokeWidth="16"
          strokeLinecap="round"
          filter="url(#pop-glow)"
          opacity="0.5"
        />
        <path
          d="M-100 540C160 420 380 620 660 540C940 460 1080 380 1360 440"
          fill="none"
          stroke="url(#pop-wave)"
          strokeWidth="22"
          strokeLinecap="round"
          filter="url(#pop-glow)"
          opacity="0.7"
        />
        <path
          d="M-60 600C180 520 460 640 740 580C1000 528 1140 490 1520 520"
          fill="none"
          stroke="url(#pop-wave)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.38"
        />
      </svg>

      <div className="popular-inner">
        <p className="popular-badge">
          <StarIcon />
          Popular Services
        </p>
        <h2 className="popular-title">
          Most Popular <span className="grad">SMM Services</span>
        </h2>
        <p className="popular-lede">
          Grow faster with our most in-demand social media services, trusted by thousands of users.
        </p>

        <ServiceCatalogGrid services={popularServices} />

        <div className="popular-cta-wrap">
          <Link className="btn btn-primary btn-lg popular-cta" href="/services">
            <LayersIcon />
            View All Services
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12 4.2 1.8 4.2 4.5.4-3.4 2.9 1 4.3L12 13.8l-4 2.2 1-4.3-3.4-2.9 4.5-.4L12 4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}