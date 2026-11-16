"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header-inner">
        <Logo />

        <button
          className="mobile-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links${open ? " open" : ""}`}>
          <Link href="/" className={pathname === "/" ? "is-active" : ""} onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link
            href="/services"
            className={pathname === "/services" ? "is-active" : ""}
            onClick={() => setOpen(false)}
          >
            Services
          </Link>
          <Link href="/pricing" onClick={() => setOpen(false)}>
            Pricing
          </Link>
          <Link
            href="/api"
            className={pathname === "/api" || pathname.startsWith("/api/") ? "is-active" : ""}
            onClick={() => setOpen(false)}
          >
            API
          </Link>
          <Link
            href="/blogs"
            className={pathname === "/blogs" || pathname.startsWith("/blogs/") ? "is-active" : ""}
            onClick={() => setOpen(false)}
          >
            Blogs
          </Link>
          <Link
            href="/support"
            className={pathname === "/support" ? "is-active" : ""}
            onClick={() => setOpen(false)}
          >
            Support
          </Link>
        </nav>

        <div className={`nav-cta${open ? " open" : ""}`}>
          <Link className="btn btn-ghost" href="/signin" onClick={() => setOpen(false)}>
            <UserIcon />
            Sign In
          </Link>
          <Link className="btn btn-primary" href="/signup" onClick={() => setOpen(false)}>
            <UserIcon />
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="4.4" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.4 12.2c.6-2.2 2.3-3.3 4.6-3.3s4 1.1 4.6 3.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
