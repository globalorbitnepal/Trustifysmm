import { sectionHeading } from "@/lib/orbit/public-copy";

const steps = [
  {
    num: "01",
    title: "Create Account",
    text: "Sign up for a free account on TrustifySMM.",
    tone: "violet",
    icon: <UserAddIcon />,
  },
  {
    num: "02",
    title: "Add Balance",
    text: "Top up your wallet with multiple secure payment options.",
    tone: "blue",
    icon: <CoinsIcon />,
  },
  {
    num: "03",
    title: "Place Order",
    text: "Choose a service, enter the details and place your order.",
    tone: "violet",
    icon: <CartIcon />,
  },
  {
    num: "04",
    title: "Get Results",
    text: "Your order will be processed instantly and delivered quickly.",
    tone: "blue",
    icon: <RocketIcon />,
  },
] as const;

const perks = [
  { label: "Fast Process", icon: <BoltIcon /> },
  { label: "Secure Payments", icon: <ShieldIcon /> },
  { label: "Fully Automated", icon: <LayersIcon /> },
  { label: "Reliable Service", icon: <TrophyIcon /> },
] as const;

export function HowItWorks() {
  const copy = sectionHeading("how");
  return (
    <section className="how" id="how">
      <svg className="how-waves" viewBox="0 0 1440 640" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="how-wave" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#C084FC" />
            <stop offset="0.45" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <filter id="how-glow">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <path
          d="M-100 180C180 60 360 220 620 140C900 48 1040 120 1320 80"
          fill="none"
          stroke="url(#how-wave)"
          strokeWidth="18"
          strokeLinecap="round"
          filter="url(#how-glow)"
          opacity="0.55"
        />
        <path
          d="M-80 520C200 400 420 600 700 520C980 440 1100 360 1380 420"
          fill="none"
          stroke="url(#how-wave)"
          strokeWidth="24"
          strokeLinecap="round"
          filter="url(#how-glow)"
          opacity="0.72"
        />
        <path
          d="M-40 580C220 500 500 620 780 560C1040 508 1180 470 1500 500"
          fill="none"
          stroke="url(#how-wave)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>

      <div className="how-inner">
        <p className="how-badge">
          <PlayBadgeIcon />
          {copy.badge}
        </p>
        <h2 className="how-title">
          {copy.title} {copy.titleAccent ? <span className="grad-cyan">{copy.titleAccent}</span> : null}
        </h2>
        <p className="how-lede">{copy.lede}</p>

        <div className="how-steps">
          {steps.map((step, i) => (
            <div key={step.num} className="how-step-wrap">
              <article className={`how-step how-step--${step.tone}`}>
                <span className="how-step-num">{step.num}</span>
                <div className={`how-step-icon how-step-icon--${step.tone}`}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
              {i < steps.length - 1 ? (
                <span className="how-step-arrow" aria-hidden>
                  <ChevronIcon />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="how-perks">
          {perks.map((perk, i) => (
            <div key={perk.label} className="how-perk">
              <span className="how-perk-icon">{perk.icon}</span>
              <span>{perk.label}</span>
              {i < perks.length - 1 ? <span className="how-perk-divider" aria-hidden /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlayBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8.2v7.6l6-3.8-6-3.8Z" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M10 8l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserAddIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 18c.9-2.8 3-4.5 5.5-4.5s4.6 1.7 5.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 8v6M15 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="8" rx="7" ry="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 8v5c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2V8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 11c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h2l1.4 9.2a2 2 0 0 0 2 1.7h7.2a2 2 0 0 0 2-1.7L20 8H7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="10" cy="19" r="1.3" fill="currentColor" />
      <circle cx="17" cy="19" r="1.3" fill="currentColor" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3c3 2.6 5 6.2 5 10.5 0 .8-.6 1.5-1.4 1.5H8.4C7.6 15 7 14.3 7 13.5 7 9.2 9 5.6 12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 15v4l2-1 2 1v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 6.5 7.5 9M14.5 6.5l2 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 5H4v2a3 3 0 0 0 3 3M18 5h2v2a3 3 0 0 1-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 14h4v2H10v-2ZM9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}