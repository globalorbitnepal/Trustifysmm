"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthDivider } from "@/components/AuthDivider";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

const PERKS = [
  {
    title: "1,900+ services",
    text: "Instagram, TikTok, YouTube, Telegram and more — live rates in USD.",
    tone: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Crypto Banker",
    text: "Top up balance with BTC, ETH, USDT and SOL — webhook-ready invoices.",
    tone: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10h4M7 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Full REST API",
    text: "Automate orders with v2 endpoints, balance checks and status polls.",
    tone: "cyan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13.5 6l-3 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Reseller ready",
    text: "Markup pricing, tickets and docs built for agencies & shops.",
    tone: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V5M4 19h16M8 16V9M12 16V7M16 16v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export function SignUpPageContent() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (!terms) {
      setError("Please accept the terms and privacy policy.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create account.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    !loading &&
    name.trim().length > 1 &&
    email.includes("@") &&
    password.length >= 8 &&
    confirm.length >= 8 &&
    terms;

  return (
  <>
    <div className="auth-signup-split">
      <div className="auth-signup-copy">
        <p className="services-page-badge auth-signup-badge">
          <SparkIcon />
          Free panel account
        </p>
        <h1 className="auth-signup-title">
          Create your <span className="grad">TrustifySMM</span> account
        </h1>
        <p className="auth-signup-lede">
          Join resellers and agencies using live catalog pricing, crypto top-ups and API automation — one premium
          dashboard for every order.
        </p>

        <ul className="auth-signup-perks">
          {PERKS.map((p) => (
            <li key={p.title} className={`auth-signup-perk auth-signup-perk--${p.tone}`}>
              <span className="auth-signup-perk-icon">{p.icon}</span>
              <div>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="auth-signup-trust" aria-label="Account highlights">
          <div>
            <strong>Instant</strong>
            <span>Catalog access</span>
          </div>
          <div>
            <strong>$0</strong>
            <span>Signup fee</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Order engine</span>
          </div>
        </div>
      </div>

      <div className="auth-signup-card-wrap">
        <div className="auth-signup-card">
          <div className="auth-signup-card-head">
            <div className="auth-signup-card-mark" aria-hidden>
              <img src="/brand/glass/glass-trustify-t.png" alt="" width={72} height={72} />
            </div>
            <h2>
              Sign up <span className="grad">free</span>
            </h2>
            <p>Already reselling? Get your API key in minutes.</p>
          </div>

          <GoogleAuthButton mode="signup" disabled={loading} />
          <AuthDivider />

          <form className="auth-signup-form" onSubmit={onSubmit}>
              <label htmlFor="signup-name">Full name</label>
              <div className="auth-signup-field">
                <span className="auth-signup-field-icon" aria-hidden>
                  <UserIcon />
                </span>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="signup-email">Email</label>
              <div className="auth-signup-field">
                <span className="auth-signup-field-icon" aria-hidden>
                  <MailIcon />
                </span>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="signup-password">Password</label>
              <div className="auth-signup-field">
                <span className="auth-signup-field-icon" aria-hidden>
                  <KeyIcon />
                </span>
                <input
                  id="signup-password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-signup-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <label htmlFor="signup-confirm">Confirm password</label>
              <div className="auth-signup-field">
                <span className="auth-signup-field-icon" aria-hidden>
                  <KeyIcon />
                </span>
                <input
                  id="signup-confirm"
                  name="confirm"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              <label className="auth-signup-check">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {error ? <p className="auth-signup-error">{error}</p> : null}

              <button className="auth-signup-submit" type="submit" disabled={!canSubmit}>
                {loading ? "Creating account…" : (
                  <>
                    Create free account
                    <ArrowIcon />
                  </>
                )}
              </button>
          </form>

          <p className="auth-signup-foot">
            <ShieldIcon />
            Encrypted signup · No card required
          </p>
          <p className="auth-signup-alt">
            Already have an account?{" "}
            <Link href="/signin" className="auth-signup-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  </>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m3 7 9 7 9-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="8" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 14h9M16 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58M9.88 5.09A10.94 10.94 0 0 1 12 5c5.5 0 9.5 4.5 10 7-.37 1.24-1.12 2.57-2.12 3.78M6.1 6.1C4.2 7.4 2.73 9.2 2 11c.5 2.5 4.5 7 10 7 1.05 0 2.05-.15 3-.43"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 4v6c0 4.5-3.2 7.7-7 8-3.8-.3-7-3.5-7-8V7l7-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}