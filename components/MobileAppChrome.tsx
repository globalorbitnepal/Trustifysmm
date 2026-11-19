"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/services", label: "Services", icon: "grid" },
  { href: "/pricing", label: "Pricing", icon: "tag" },
  { href: "/support", label: "Support", icon: "help" },
  { href: "/signin", label: "Account", icon: "user", dash: "/dashboard" },
] as const;

export function MobileAppChrome() {
  const pathname = usePathname();
  const [accountHref, setAccountHref] = useState("/signin");
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    void fetch("/api/dashboard/session").then((res) => {
      if (res.ok) setAccountHref("/dashboard");
    });
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    function onPrompt(event: Event) {
      event.preventDefault();
      setInstall(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orbit") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup")
  ) {
    return null;
  }

  async function installApp() {
    if (!install) return;
    await install.prompt();
    setInstall(null);
    setHidden(true);
  }

  return (
    <>
      {install && !hidden ? (
        <div className="install-banner">
          <p>Install TrustifySMM</p>
          <button type="button" onClick={() => void installApp()}>Install</button>
        </div>
      ) : null}
      <nav className="app-tabbar" aria-label="App">
        {TABS.map((tab) => {
          const href = tab.href === "/signin" ? accountHref : tab.href;
          const on = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={tab.label} href={href} className={`app-tab${on ? " is-on" : ""}`}>
              <TabIcon name={tab.icon} />
              <span>{tab.href === "/signin" && accountHref === "/dashboard" ? "Panel" : tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

function TabIcon({ name }: { name: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {name === "home" ? <path {...p} d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" /> : null}
      {name === "grid" ? <path {...p} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> : null}
      {name === "tag" ? <path {...p} d="M3 12V4h8l10 10-8 8L3 12zm5-4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" /> : null}
      {name === "help" ? <path {...p} d="M12 17h.01M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.8.3-1.2.8-1.2 1.6V14M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" /> : null}
      {name === "user" ? <path {...p} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0" /> : null}
    </svg>
  );
}
