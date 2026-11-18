import Link from "next/link";
import { PlatformFilterIcon } from "@/components/PlatformFilterIcon";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { defaultPlatformCards } from "@/lib/orbit/home-defaults";
import { sectionHeading } from "@/lib/orbit/public-copy";

export function SupportedPlatforms() {
  const site = liveSiteConfig();
  const platforms = site.platformCards?.length ? site.platformCards : defaultPlatformCards;
  const copy = sectionHeading("platforms");
  return (
    <section className="platforms" id="platforms">
      <svg className="platforms-waves" viewBox="0 0 1440 720" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="pw-a" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#E879F9" />
            <stop offset="0.5" stopColor="#818CF8" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <filter id="pw-glow">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M-120 520C140 360 280 600 520 500C760 400 840 260 1120 300C1280 324 1380 420 1580 360"
          fill="none"
          stroke="url(#pw-a)"
          strokeWidth="22"
          strokeLinecap="round"
          filter="url(#pw-glow)"
          opacity="0.75"
        />
        <path
          d="M-80 590C160 480 340 650 580 560C820 470 900 340 1180 380C1340 404 1420 500 1560 440"
          fill="none"
          stroke="url(#pw-a)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M120 160C320 80 460 200 700 140C940 82 1080 40 1320 120"
          fill="none"
          stroke="url(#pw-a)"
          strokeWidth="14"
          strokeLinecap="round"
          filter="url(#pw-glow)"
          opacity="0.35"
        />
      </svg>

      <div className="platforms-inner">
        <p className="platforms-badge">
          <GridIcon />
          {copy.badge}
        </p>
        <h2 className="platforms-title">
          {copy.title} {copy.titleAccent ? <span className="grad">{copy.titleAccent}</span> : null}
        </h2>
        <p className="platforms-lede">{copy.lede}</p>

        <div className="platforms-grid">
          {platforms.map((p) => (
            <article key={p.id} className={`platform-card platform-card--${p.id}`}>
              <div className={`platform-mark platform-mark--${p.id}`}>
                {p.iconUrl ? (
                  <img src={p.iconUrl} alt="" width={52} height={52} />
                ) : p.id === "more" ? (
                  <MoreMark />
                ) : (
                  <PlatformFilterIcon platform={p.id} variant="tile" className="platform-card-logo" />
                )}
              </div>
              <h3>{p.name}</h3>
              <p>{p.services}</p>
            </article>
          ))}
        </div>

        <div className="platforms-cta-wrap">
          <Link className="btn btn-primary btn-lg platforms-cta" href="/#services">
            Explore All Services
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

function MoreMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="7" cy="7" r="2.2" fill="#fff" />
      <circle cx="17" cy="7" r="2.2" fill="#fff" />
      <circle cx="7" cy="17" r="2.2" fill="#fff" />
      <circle cx="17" cy="17" r="2.2" fill="#fff" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
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