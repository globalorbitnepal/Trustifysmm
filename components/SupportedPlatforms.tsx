import Link from "next/link";

const platforms = [
  { id: "instagram", name: "Instagram", services: "Followers, Likes, Views" },
  { id: "youtube", name: "YouTube", services: "Subscribers, Views, Likes" },
  { id: "tiktok", name: "TikTok", services: "Followers, Likes, Views" },
  { id: "facebook", name: "Facebook", services: "Followers, Likes, Shares" },
  { id: "x", name: "X (Twitter)", services: "Followers, Likes, Retweets" },
  { id: "telegram", name: "Telegram", services: "Members, Views, Reactions" },
  { id: "whatsapp", name: "WhatsApp", services: "Channel & Group Growth" },
  { id: "snapchat", name: "Snapchat", services: "Followers, Views, Engagement" },
  { id: "threads", name: "Threads", services: "Followers, Likes, Replies" },
  { id: "more", name: "More Platforms", services: "And Many More..." },
] as const;

export function SupportedPlatforms() {
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
          Supported Platforms
        </p>
        <h2 className="platforms-title">
          All Major <span className="grad">Social Media Platforms</span>
        </h2>
        <p className="platforms-lede">
          One panel for all your social media marketing needs. Get real and high-quality services across
          the world&apos;s leading platforms.
        </p>

        <div className="platforms-grid">
          {platforms.map((p) => (
            <article key={p.id} className={`platform-card platform-card--${p.id}`}>
              <div className={`platform-mark platform-mark--${p.id}`}>
                <PlatformLogo id={p.id} />
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

function PlatformLogo({ id }: { id: (typeof platforms)[number]["id"] }) {
  switch (id) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0">
              <stop stopColor="#FEDA75" />
              <stop offset="0.35" stopColor="#FA7E1E" />
              <stop offset="0.65" stopColor="#D62976" />
              <stop offset="1" stopColor="#962FBF" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#ig)" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.6" />
          <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
          <path d="M10 9.2v5.6L15.5 12 10 9.2Z" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            d="M15.5 4.2c.6 1.9 1.8 3.3 3.8 3.6v3.1c-1.4 0-2.8-.4-4-1.2v5.4c0 3.2-2 5.4-5 5.4-2.6 0-4.8-2-4.8-4.7 0-2.8 2.4-4.7 5.3-4.2v3.3c-.9-.3-2 .1-2 1.2 0 .8.6 1.4 1.5 1.4 1 0 1.7-.7 1.7-2V4.2h2.5Z"
            fill="#fff"
          />
          <path
            d="M15.5 4.2c.6 1.9 1.8 3.3 3.8 3.6v3.1c-1.4 0-2.8-.4-4-1.2v5.4c0 3.2-2 5.4-5 5.4"
            fill="none"
            stroke="#25F4EE"
            strokeWidth="0.6"
          />
          <path d="M15.5 4.2v12.8" stroke="#FE2C55" strokeWidth="0.6" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#1877F2" />
          <path
            d="M13.5 8.2h2.1V6.4c-.4 0-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.1H6.5v2.3h2.1v7h2.7v-7h2.4l.4-2.3h-2.8v-1.8c0-.7.2-1.2 1.2-1.2Z"
            fill="#fff"
          />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#0f0f14" />
          <path d="M7 7.5 11.2 13 7 16.5h1.5l3-3.3 2.5 3.3H16l-4.4-5.8L15.8 7.5H14.3l-2.8 3-2.2-3H7Zm1.8 8.2h1l5.6-7.4h-1l-5.6 7.4Z" fill="#fff" />
        </svg>
      );
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#29A9EB" />
          <path
            d="M6.4 11.4 16.8 7.5c.5-.2 1 .2.8.8l-1.6 6.6c-.1.5-.6.7-1 .4l-3.2-2.3-1.5 1.5c-.2.2-.4.2-.6.1l.2-2.2 5.9-5.4c.2-.2 0-.4-.3-.2l-7.3 4.6-3.1-1c-.5-.2-.5-.8.1-1Z"
            fill="#fff"
          />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#25D366" />
          <path
            d="M8.2 8.4c2.7-2.7 7.3-1.1 8.4 2.5.6 2.1-.2 4.3-1.9 5.5l-.5 3.5-3.2-1.4-2.4 1.1c-3 .4-5.6-2.2-5.2-5.3.1-.8.7-1.6 1.2-2.2l-.4-3.7Z"
            fill="#fff"
          />
          <path
            d="M10.2 10.3c.1-.2.2-.3.4-.2.4.2 1.3.8 1.7 1.2.1.1.1.3 0 .4l-.6.7c-.1.1-.1.3 0 .4.4.5 1 .9 1.6 1.2.1.1.3 0 .4-.1l.5-.6c.1-.1.3-.1.4 0 .3.2 1 .7 1.2 1 .1.1.1.3 0 .4-.3.6-1.1 1.4-1.6 1.6-.5.2-1.1.2-1.8-.2-2-.9-3.3-2.8-3.4-4.2 0-.5.2-1 .6-1.4Z"
            fill="#25D366"
          />
        </svg>
      );
    case "snapchat":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#FFFC00" />
          <path
            d="M12 6.5c1.8 0 3.2 1.2 3.2 2.7 0 1-.5 1.8-1.3 2.3.9.4 1.6 1.2 1.8 2.2.7-.2 1.4-.1 2 .3-.1.8-.8 1.2-1.6 1.1.1.6 0 1.2-.4 1.7-.8.4-1.8.6-2.8.6-.5 0-1.6-.1-2.4-.3-.5-.9-.6-1.9-.4-2.9-.7-.1-1.3-.5-1.5-1.2.6-.4 1.3-.5 2-.3.2-1 .9-1.8 1.8-2.2-.8-.5-1.3-1.3-1.3-2.3 0-1.5 1.4-2.7 3.2-2.7Z"
            fill="#0f0f14"
          />
        </svg>
      );
    case "threads":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#101010" />
          <path
            d="M14.2 8.5c-1.4-.7-3.3-.5-4.3 1.1-.7 1.1-.6 2.5.1 3.4 1-.9 2.5-1.2 3.7-.6 1.4.7 2.1 2.3 1.5 3.8-.9 2.2-3.6 3.1-5.8 2.1-.5-.2-.9-.5-1.3-.8.8 1.4 2.4 2.2 4.1 2 2.3-.3 4-2.4 3.8-4.7-.2-2.8-2.7-4.5-4.8-5.4 1.4.2 2.8.9 3.7 2.2Z"
            fill="#fff"
          />
        </svg>
      );
    case "more":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="7" cy="7" r="2.2" fill="#fff" />
          <circle cx="17" cy="7" r="2.2" fill="#fff" />
          <circle cx="7" cy="17" r="2.2" fill="#fff" />
          <circle cx="17" cy="17" r="2.2" fill="#fff" />
        </svg>
      );
    default:
      return null;
  }
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