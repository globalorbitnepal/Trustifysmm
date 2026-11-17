import Link from "next/link";
import { BrandGlassIcon, type BrandGlassId } from "@/components/BrandGlassIcon";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { PayCoinArt } from "@/components/PayCoinArt";
import { Logo } from "./Logo";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/platforms", label: "Platforms" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/reviews", label: "Customer Reviews" },
] as const;

const panelLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/api", label: "API Documentation" },
  { href: "/signin", label: "Sign In" },
  { href: "/signup", label: "Create Account" },
] as const;

const socialPlatforms: { href: string; id: BrandGlassId; label: string }[] = [
  { href: "https://instagram.com", id: "instagram", label: "Instagram" },
  { href: "https://facebook.com", id: "facebook", label: "Facebook" },
  { href: "https://x.com", id: "x", label: "X" },
  { href: "https://t.me", id: "telegram", label: "Telegram" },
  { href: "https://youtube.com", id: "youtube", label: "YouTube" },
  { href: "https://tiktok.com", id: "tiktok", label: "TikTok" },
  { href: "https://whatsapp.com", id: "whatsapp", label: "WhatsApp" },
];

function footerStats() {
  return liveSiteConfig().footerStats;
}

const coins = ["btc", "eth", "usdt", "sol"] as const;

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav className="site-footer-nav-col" aria-label={title}>
      <h3>{title}</h3>
      <ul>
        {links.map((item) => (
          <li key={item.label}>
            {item.href.startsWith("mailto:") ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <Link href={item.href} prefetch={!item.href.includes("#")}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const stats = footerStats();
  const contact = liveSiteConfig().contact;
  const copy = liveSiteConfig().footerCopy;
  const supportLinks = [
    { href: "/support", label: "Help Center" },
    { href: "/blogs", label: "Blog" },
    { href: `mailto:${contact.email}`, label: "Email Support" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ];
  const whatsappHref = contact.whatsapp
    ? contact.whatsapp.startsWith("http")
      ? contact.whatsapp
      : `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`
    : "https://whatsapp.com";

  return (
    <footer className="site-footer" id="footer">
      <div className="site-footer-inner">
        <div className="site-footer-head">
          <div className="site-footer-head-copy">
            <p className="site-footer-kicker">TrustifySMM</p>
            <h2 className="site-footer-headline">
              {copy.blurb === "Premium growth from one panel" ? (
                <>
                  Premium growth from <span className="grad">one panel</span>
                </>
              ) : (
                copy.blurb
              )}
            </h2>
          </div>
          <div className="site-footer-head-actions">
            <Link className="btn btn-primary" href="/signup">
              <RocketIcon />
              Get Started
            </Link>
            <Link className="btn btn-ghost" href="/services">
              Services
            </Link>
          </div>
        </div>

        <section className="site-footer-social" aria-labelledby="footer-social-title">
          <h3 id="footer-social-title" className="site-footer-social-title">
            Follow us on social
          </h3>
          <div className="site-footer-social-row" role="list">
            {socialPlatforms.map((item) => {
              const href =
                item.id === "whatsapp"
                  ? whatsappHref
                  : item.id === "telegram" && contact.telegram
                    ? contact.telegram
                    : item.href;
              return (
              <a
                key={item.id}
                href={href}
                className="site-footer-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                title={item.label}
              >
                <BrandGlassIcon id={item.id} className="site-footer-social-icon" />
                <span>{item.label}</span>
              </a>
              );
            })}
          </div>
        </section>

        <p className="site-footer-divider" aria-hidden />

        <div className="site-footer-columns">
          <div className="site-footer-brand">
            <Logo />
            <p className="site-footer-about">
              Reliable, affordable and fully automated SMM services for resellers, agencies and
              creators across every major platform.
            </p>
            <div className="site-footer-metrics" role="list">
              {stats.map((stat) => (
                <div key={stat.label} className="site-footer-metric" role="listitem">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
            <a className="site-footer-mail" href={`mailto:${contact.email}`}>
              <MailIcon />
              {contact.email}
            </a>
            {contact.phone ? (
              <a className="site-footer-mail" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                {contact.phone}
              </a>
            ) : null}
          </div>

          <div className="site-footer-navs">
            <LinkColumn title="Explore" links={exploreLinks} />
            <LinkColumn title="Panel" links={panelLinks} />
            <LinkColumn title="Support" links={supportLinks} />
          </div>
        </div>

        <p className="site-footer-divider" aria-hidden />

        <div className="site-footer-util">
          <div className="site-footer-pay">
            <span className="site-footer-pay-label">Crypto payments</span>
            <span className="site-footer-pay-tickers">BTC · ETH · USDT · SOL</span>
            <span className="site-footer-pay-coins" aria-hidden>
              {coins.map((id) => (
                <PayCoinArt key={id} id={id} className="site-footer-coin-art" />
              ))}
            </span>
          </div>
          <div className="site-footer-trust">
            <span>
              <ShieldIcon />
              Secure payments
            </span>
            <span>
              <BoltIcon />
              24/7 automation
            </span>
            <span>
              <HeadsetIcon />
              Dedicated support
            </span>
          </div>
        </div>

        <div className="site-footer-bar">
          <p>© {year} {copy.copyright}</p>
          <div className="site-footer-legal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/support">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="2.8" y="5.2" width="14.4" height="10.6" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m3.6 6.2 6.4 4.8 6.4-4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5 4.5 4.8v5.2c0 3.6 2.3 5.8 5.5 7.5 3.2-1.7 5.5-3.9 5.5-7.5V4.8L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10.8 3.2 5.8 11h3.6l-.8 6.8 5.8-7.8h-3.4l.8-6.8Z" fill="currentColor" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4.5 11.2V9.8C4.5 6.6 6.9 4 10 4s5.5 2.6 5.5 5.8v1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="3" y="11" width="3.6" height="5" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <rect x="13.4" y="11" width="3.6" height="5" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M9.2 2.2c2.2.4 3.8 1.8 4.6 4.1-1.6.2-3 .8-4.1 1.8L8.2 6.6c1-.9 1.6-2.1 1-4.4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M6.4 7.4 4.2 9.6c.4 1.2.2 2.2-.4 3 .8-.2 1.8-.4 3-.2l2.2-2.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}