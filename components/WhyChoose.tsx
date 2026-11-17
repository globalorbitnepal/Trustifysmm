import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { sectionHeading } from "@/lib/orbit/public-copy";

const defaultFeatures = [
  {
    title: "Instant Orders",
    text: "Get your orders started within seconds, 24/7 automated system.",
    tone: "violet",
    icon: <BoltIcon />,
  },
  {
    title: "Reliable & Secure",
    text: "Your data and payments are always safe and protected.",
    tone: "blue",
    icon: <ShieldIcon />,
  },
  {
    title: "Wide Service Range",
    text: "All major social media platforms in one powerful panel.",
    tone: "violet",
    icon: <LayersIcon />,
  },
  {
    title: "Dedicated Support",
    text: "Get quick and friendly support whenever you need help.",
    tone: "blue",
    icon: <HeadsetIcon />,
  },
] as const;

const statIcons = [<UsersIcon key="u" />, <CartIcon key="c" />, <ChartIcon key="ch" />, <TrophyIcon key="t" />];

export function WhyChoose() {
  const site = liveSiteConfig();
  const copy = sectionHeading("why");
  const features = defaultFeatures.map((item, i) => {
    const edited = site.whyFeatures[i];
    return edited
      ? { ...item, title: edited.title, text: edited.text, tone: edited.tone }
      : item;
  });
  const stats = site.footerStats.map((s, i) => ({
    ...s,
    icon: statIcons[i] ?? statIcons[0],
  }));

  return (
    <section className="why" id="why">
      <div className="why-inner">
        <p className="why-badge">
          <BoltIcon />
          {copy.badge}
        </p>
        <h2 className="why-title">
          {copy.title} {copy.titleAccent ? <span className="grad">{copy.titleAccent}</span> : null}
        </h2>
        <p className="why-lede">{copy.lede}</p>

        <div className="why-grid">
          {features.map((item) => (
            <article key={item.title} className={`why-card why-card--${item.tone}`}>
              <div className={`why-icon why-icon--${item.tone}`}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <div className="why-stats">
          {stats.map((stat, i) => (
            <div key={stat.label} className="why-stat">
              <span className="why-stat-icon">{stat.icon}</span>
              <div className="why-stat-copy">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
              {i < stats.length - 1 ? <span className="why-stat-divider" aria-hidden /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 6 13h5l-1 9 9-12h-6l1-8Z" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 5 6v6c0 4.2 3 7.9 7 9 4-1.1 7-4.8 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5M3 18l9 5 9-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14a8 8 0 0 1 16 0v3a3 3 0 0 1-3 3h-1v-4H8v4H7a3 3 0 0 1-3-3v-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 17v3a4 4 0 0 0 8 0v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 18c.8-2.8 3-4.5 5.5-4.5s4.7 1.7 5.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14.5 18c.5-1.6 1.8-2.7 3.5-2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h2l1.4 9.2a2 2 0 0 0 2 1.7h7.2a2 2 0 0 0 2-1.7L20 8H7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.2" fill="currentColor" />
      <circle cx="17" cy="19" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 19V9M11 19V5M17 19v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4h8v3a4 4 0 0 1-8 0V4ZM6 5H4v2a3 3 0 0 0 3 3M18 5h2v2a3 3 0 0 1-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 14h4v2H10v-2ZM9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}