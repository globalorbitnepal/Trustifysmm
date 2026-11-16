"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <Logo />

      <button
        className="mobile-toggle"
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>

      <nav className={`nav-links${open ? " open" : ""}`}>
        <Link className="home-pill" href="/">
          Home
        </Link>
        <details className="dropdown">
          <summary>
            Services
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
              <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </summary>
          <div className="dropdown-menu">
            <Link href="/#instagram">Instagram</Link>
            <Link href="/#tiktok">TikTok</Link>
            <Link href="/#youtube">YouTube</Link>
            <Link href="/#facebook">Facebook</Link>
          </div>
        </details>
        <Link href="/pricing">Pricing</Link>
        <Link href="/api">API</Link>
        <Link href="/blogs">Blogs</Link>
        <Link href="/support">Support</Link>
      </nav>

      <div className={`nav-cta${open ? " open" : ""}`}>
        <Link className="btn btn-signin" href="/signin">
          <UserIcon /> Sign In
        </Link>
        <Link className="btn btn-signup" href="/signup">
          <UserIcon filled /> Sign Up
        </Link>
      </div>
    </header>
  );
}

function UserIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.2-3.4 3.6-5 7-5s5.8 1.6 7 5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill={filled ? "currentColor" : "none"}
        strokeLinecap="round"
      />
    </svg>
  );
}
