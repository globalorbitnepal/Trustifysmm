"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthDivider } from "@/components/AuthDivider";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

const PERKS = [
  {
    title: "Order desk",
    text: "Place, track and refill orders across 1,900+ services from one dashboard.",
    tone: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M9 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Banker balance",
    text: "Crypto invoices, webhook top-ups and live USD wallet for every campaign.",
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
    title: "API & keys",
    text: "Rotate API keys, poll status and automate bulk orders with REST v2.",
    tone: "cyan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13.5 6l-3 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Help & tickets",
    text: "Open tickets with order IDs — premium support when campaigns need a human.",
    tone: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 6h16v10a2 2 0 0 1-2 2H8l-4 3V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const OAUTH_ERRORS: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  invalid_oauth_state: "Sign-in expired. Please try again.",
  google_not_configured: "Google Sign-In is not configured yet.",
  account_conflict: "Could not link this Google account. Contact support.",
  google_callback_failed: "Google sign-in failed. Try again.",
  session_unavailable: "Server session secret is missing. Set SESSION_SECRET.",
};

export function SignInPageContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = search.get("error");
    if (code) setError(OAUTH_ERRORS[code] ?? "Could not sign in. Try again.");
  }, [search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 4) {
      setError("Enter your panel password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not sign in.");
        return;
      }
      const next = search.get("next") || "/dashboard";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && email.includes("@") && password.length >= 4;

  return (
    <div className="auth-signup-split">
      <div className="auth-signup-copy">
        <p className="services-page-badge auth-signup-badge">
          <DoorIcon />
          Panel access
        </p>
        <h1 className="auth-signup-title">
          Sign in to <span className="grad">TrustifySMM</span>
        </h1>
        <p className="auth-signup-lede">
          Welcome back — manage orders, refill campaigns, top up via Banker and copy API keys from your reseller
          dashboard.
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

        <div className="auth-signup-trust" aria-label="Panel highlights">
          <div>
            <strong>1,900+</strong>
            <span>Live services</span>
          </div>
          <div>
            <strong>API</strong>
            <span>v2 ready</span>
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
              Welcome <span className="grad">back</span>
            </h2>
            <p>Use the email and password from your reseller account.</p>
          </div>

          <GoogleAuthButton mode="login" disabled={loading} />
          <AuthDivider />

          <form className="auth-signup-form" onSubmit={onSubmit}>
              <label htmlFor="signin-email">Email</label>
              <div className="auth-signup-field">
                <span className="auth-signup-field-icon" aria-hidden>
                  <MailIcon />
                </span>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label htmlFor="signin-password">Password</label>
              <div className="auth-signup-field">
                <span className="auth-signup-field-icon" aria-hidden>
                  <KeyIcon />
                </span>
                <input
                  id="signin-password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
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

              <div className="auth-signin-row">
                <label className="auth-signup-check auth-signin-remember">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <Link href="/support" className="auth-signin-forgot">
                  Forgot password?
                </Link>
              </div>

              {error ? <p className="auth-signup-error">{error}</p> : null}

              <button className="auth-signup-submit" type="submit" disabled={!canSubmit}>
                {loading ? "Signing in…" : (
                  <>
                    Sign in to panel
                    <ArrowIcon />
                  </>
                )}
              </button>
          </form>

          <p className="auth-signup-foot">
            <ShieldIcon />
            Secure session · HTTPS only
          </p>
          <p className="auth-signup-alt">
            New to TrustifySMM?{" "}
            <Link href="/signup" className="auth-signup-link">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function DoorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M4 20h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9 20V4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
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