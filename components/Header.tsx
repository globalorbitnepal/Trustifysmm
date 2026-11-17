"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function Header({
  logoSrc = "/brand/logo-header-clear.png",
  links = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/api", label: "API" },
    { href: "/blogs", label: "Blogs" },
    { href: "/support", label: "Support" },
  ],
  signInLabel = "Sign In",
  signUpLabel = "Sign Up",
}: {
  logoSrc?: string;
  links?: { href: string; label: string }[];
  signInLabel?: string;
  signUpLabel?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header-inner">
        <Logo src={logoSrc} />

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
          {links.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              prefetch
              className={item.href === "/" ? (pathname === "/" ? "is-active" : "") : pathname === item.href || pathname.startsWith(`${item.href}/`) ? "is-active" : ""}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={`nav-cta${open ? " open" : ""}`}>
          <Link className="btn btn-ghost" href="/signin" prefetch onClick={() => setOpen(false)}>
            <UserIcon />
            {signInLabel}
          </Link>
          <Link className="btn btn-primary" href="/signup" prefetch onClick={() => setOpen(false)}>
            <UserIcon />
            {signUpLabel}
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
