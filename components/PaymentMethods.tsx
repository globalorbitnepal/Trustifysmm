import Link from "next/link";
import { PaymentWalletVisual } from "@/components/PaymentWalletVisual";
import type { CryptoId } from "@/components/CryptoBrandIcon";
import { PayCoinArt } from "@/components/PayCoinArt";

const coins = [
  { id: "btc", name: "Bitcoin", ticker: "BTC", tone: "violet" },
  { id: "eth", name: "Ethereum", ticker: "ETH", tone: "blue" },
  { id: "usdt", name: "Tether", ticker: "USDT", tone: "violet" },
  { id: "sol", name: "Solana", ticker: "SOL", tone: "blue" },
] as const;

const perks = [
  { label: "Instant Deposit", icon: <BoltIcon /> },
  { label: "Secure Transactions", icon: <ShieldIcon /> },
  { label: "Global Support", icon: <GlobeIcon /> },
] as const;

export function PaymentMethods() {
  return (
    <section className="payments" id="payments">
      <svg className="payments-waves" viewBox="0 0 1440 720" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="pay-wave" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#E879F9" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
          <filter id="pay-glow">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <path
          d="M-140 100C120 20 300 170 560 90C840 0 980 80 1260 50"
          fill="none"
          stroke="url(#pay-wave)"
          strokeWidth="18"
          strokeLinecap="round"
          filter="url(#pay-glow)"
          opacity="0.52"
        />
        <path
          d="M-100 560C180 430 400 650 680 560C960 470 1100 400 1380 460"
          fill="none"
          stroke="url(#pay-wave)"
          strokeWidth="26"
          strokeLinecap="round"
          filter="url(#pay-glow)"
          opacity="0.78"
        />
        <path
          d="M-60 620C180 540 460 660 740 600C1000 548 1180 510 1520 540"
          fill="none"
          stroke="url(#pay-wave)"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>

      <div className="payments-inner">
        <p className="payments-badge">
          <WalletIcon />
          Payment Methods
        </p>
        <h2 className="payments-title">
          Secure &amp; Fast <span className="grad">Payments</span>
        </h2>
        <p className="payments-lede">
          Add funds to your account instantly with supported cryptocurrencies.
        </p>

        <div className="payments-showcase">
          <PaymentWalletVisual />
          <div className="payments-coins">
            {coins.map((coin) => (
              <article key={coin.id} className={`pay-card pay-card--${coin.id} pay-card--${coin.tone}`}>
                <PayCoinArt id={coin.id as CryptoId} className="pay-coin-hero" />
                <h3>{coin.name}</h3>
                <span className="pay-ticker">{coin.ticker}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="payments-perks">
          {perks.map((perk, i) => (
            <div key={perk.label} className="payments-perk">
              <span className="payments-perk-icon">{perk.icon}</span>
              <span>{perk.label}</span>
              {i < perks.length - 1 ? <span className="payments-perk-divider" aria-hidden /> : null}
            </div>
          ))}
        </div>

        <div className="payments-cta-wrap">
          <Link className="btn btn-primary btn-lg payments-cta" href="/signup">
            <WalletIcon />
            Add Funds Now
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5A3.5 3.5 0 0 1 7.5 5H18v14H7.5A3.5 3.5 0 0 1 4 15.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M18 9h3.5a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H18" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18.5" cy="12" r="1" fill="currentColor" />
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
      <path d="m8.5 12 2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" stroke="currentColor" strokeWidth="1.5" />
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