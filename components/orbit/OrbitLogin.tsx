"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const FEATURES = [
  {
    title: "Manage Services",
    desc: "Catalog, tiers & availability",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    tone: "violet" as const,
  },
  {
    title: "Rates & Orders",
    desc: "Margins, overrides & flow",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    tone: "blue" as const,
  },
  {
    title: "User Control",
    desc: "Roles, keys & access",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 17.5c.8-.6 1.8-1 3-1 2.2 0 4 1.3 4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    tone: "violet" as const,
  },
  {
    title: "System Settings",
    desc: "SEO, pages & Banker",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    tone: "cyan" as const,
  },
];

export function OrbitLogin() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/orbit";
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orbit/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      });
      if (!res.ok) {
        setError("That passkey is not recognized.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="orbit-cc">
      <div className="orbit-cc-bg" aria-hidden>
        <div className="orbit-cc-bg-veil" />
        <div className="orbit-cc-bg-grid" />
        <div className="orbit-cc-ribbon orbit-cc-ribbon--a" />
        <div className="orbit-cc-ribbon orbit-cc-ribbon--b" />
        <div className="orbit-cc-glow orbit-cc-glow--l" />
        <div className="orbit-cc-glow orbit-cc-glow--r" />
      </div>

      <header className="orbit-cc-top">
        <a href="/" className="orbit-cc-logo" aria-label="TrustifySMM home">
          <img src="/brand/logo-on-dark.png" alt="" width={1024} height={341} />
        </a>
        <p className="orbit-cc-restricted">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Restricted <span aria-hidden>•</span> Operator Only
        </p>
      </header>

      <div className="orbit-cc-layout">
        <section className="orbit-cc-hero">
          <p className="orbit-cc-tag">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            / Orbit
          </p>
          <h1>
            Orbit
            <span className="orbit-cc-gradient">Control Center</span>
          </h1>
          <p className="orbit-cc-lead">
            A private workspace to manage services, rates, users, orders and system operations — all in one place.
          </p>
          <ul className="orbit-cc-features">
            {FEATURES.map((f) => (
              <li key={f.title} className={`orbit-cc-tile orbit-cc-tile--${f.tone}`}>
                <span className="orbit-cc-tile-icon">{f.icon}</span>
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="orbit-cc-signin-wrap">
          <div className="orbit-cc-signin">
            <div className="orbit-cc-signin-head">
              <div className="orbit-cc-stack-icon" aria-hidden>
                <img src="/brand/glass/glass-trustify-t.png" alt="" width={96} height={96} />
              </div>
              <h2>
                Sign In to <span className="orbit-cc-gradient">Orbit</span>
              </h2>
              <p>Access your private dashboard</p>
            </div>

            <form onSubmit={onSubmit}>
              <label htmlFor="orbit-passkey">Passkey</label>
              <div className={`orbit-cc-field${error ? " is-error" : ""}`}>
                <span className="orbit-cc-field-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="8" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 14h8M16 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="orbit-passkey"
                  type={show ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="•••••••••"
                  required
                />
                <button
                  type="button"
                  className="orbit-cc-eye"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide passkey" : "Show passkey"}
                >
                  {show ? (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58M9.88 5.09A10.94 10.94 0 0 1 12 5c5.5 0 9.5 4.5 10 7-.37 1.24-1.12 2.57-2.12 3.78M6.1 6.1C4.2 7.4 2.73 9.2 2 11c.5 2.5 4.5 7 10 7 1.05 0 2.05-.15 3-.43"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
              {error ? <p className="orbit-cc-error">{error}</p> : null}
              <button className="orbit-cc-enter" type="submit" disabled={loading || passkey.trim().length === 0}>
                {loading ? "Checking…" : (
                  <>
                    Enter Orbit
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="orbit-cc-secure">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3l7 4v6c0 4.5-3.2 7.7-7 8-3.8-.3-7-3.5-7-8V7l7-4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Encrypted Session <span aria-hidden>•</span> No Public Index
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}