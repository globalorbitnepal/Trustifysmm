"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DashboardBrandLockup } from "@/components/dashboard/DashboardBrandLockup";
import { formatWalletUsd } from "@/lib/money";

type SessionUser = {
  name: string | null;
  email: string;
  image: string | null;
  balance: number;
};

const NAV: { section: string; items: [string, string, string][] }[] = [
  {
    section: "Main menu",
    items: [
      ["Overview", "/dashboard", "grid"],
      ["New Order", "/dashboard/new-order", "plus"],
      ["Services", "/dashboard/services", "layers"],
      ["Mass Order", "/dashboard/mass-order", "list"],
      ["My Orders", "/dashboard/orders", "box"],
      ["Order History", "/dashboard/history", "clock"],
      ["Favorites", "/dashboard/favorites", "star"],
    ],
  },
  {
    section: "Wallet",
    items: [
      ["Add Funds", "/dashboard/add-funds", "wallet"],
      ["Transactions", "/dashboard/transactions", "swap"],
      ["Payment History", "/dashboard/payments", "coin"],
    ],
  },
  {
    section: "Support",
    items: [
      ["Support Tickets", "/dashboard/tickets", "ticket"],
      ["Help Center", "/dashboard/help", "help"],
      ["API Documentation", "/dashboard/api", "code"],
    ],
  },
  {
    section: "Account",
    items: [
      ["My Profile", "/dashboard/profile", "user"],
      ["Security Settings", "/dashboard/security", "shield"],
      ["Notifications", "/dashboard/notifications", "bell"],
      ["Logout", "#logout", "out"],
    ],
  },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/new-order": "New Order",
  "/dashboard/services": "Services",
  "/dashboard/mass-order": "Mass Order",
  "/dashboard/orders": "My Orders",
  "/dashboard/history": "Order History",
  "/dashboard/favorites": "Favorites",
  "/dashboard/add-funds": "Add Funds",
  "/dashboard/transactions": "Transactions",
  "/dashboard/payments": "Payment History",
  "/dashboard/tickets": "Support Tickets",
  "/dashboard/help": "Help Center",
  "/dashboard/notifications": "Notifications",
  "/dashboard/profile": "My Profile",
  "/dashboard/security": "Security",
  "/dashboard/api": "API Documentation",
  "/dashboard/analytics": "Analytics",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [light, setLight] = useState(false);

  useEffect(() => {
    const next = localStorage.getItem("trustify-dash-theme") === "light";
    setLight(next);
    document.documentElement.toggleAttribute("data-dash", false);
    if (next) document.documentElement.setAttribute("data-dash", "light");
    else document.documentElement.removeAttribute("data-dash");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/dashboard/session");
      if (cancelled) return;
      if (!res.ok) {
        router.replace(`/signin?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const data = (await res.json()) as { user: SessionUser; unread: number };
      setUser(data.user);
      setUnread(data.unread);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    function onWallet(event: Event) {
      const balance = (event as CustomEvent<number>).detail;
      if (typeof balance !== "number") return;
      setUser((current) => (current ? { ...current, balance } : current));
    }
    window.addEventListener("trustify-wallet", onWallet);
    return () => window.removeEventListener("trustify-wallet", onWallet);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.add("is-dash-app");
    return () => document.documentElement.classList.remove("is-dash-app");
  }, []);

  useEffect(() => {
    if (!open && !search) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, search]);

  useEffect(() => {
    if (!menu) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".cp-profile")) return;
      setMenu(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [menu]);

  const title = pathname.startsWith("/dashboard/orders/")
    ? "Order details"
    : pathname.startsWith("/dashboard/tickets/")
      ? "Ticket"
      : TITLES[pathname] || "Dashboard";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NAV.flatMap((group) => group.items)
      .filter((item) => item[1] !== "#logout" && (!q || item[0].toLowerCase().includes(q)))
      .slice(0, 8);
  }, [query]);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    localStorage.setItem("trustify-dash-theme", next ? "light" : "dark");
    if (next) document.documentElement.setAttribute("data-dash", "light");
    else document.documentElement.removeAttribute("data-dash");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/signin");
    router.refresh();
  }

  const name = user?.name?.trim() || user?.email.split("@")[0] || "Customer";

  return (
    <div className={`cp ${collapsed ? "is-collapsed" : ""} ${light ? "is-light" : ""}`}>
      <aside className={`cp-side ${open ? "is-open" : ""}`}>
        <div className="cp-brand">
          <DashboardBrandLockup theme={light ? "light" : "dark"} />
          <div className="cp-user-card">
            <Avatar user={user} />
            <div>
              <strong>{formatWalletUsd(user?.balance ?? 0)}</strong>
              <span>{name}</span>
            </div>
          </div>
        </div>
        <nav>
          {NAV.map((group) => (
            <div key={group.section}>
              <p className="cp-section">{group.section}</p>
              {group.items.map(([label, href, icon]) => {
                const active =
                  href !== "#logout" &&
                  (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
                if (href === "#logout") {
                  return (
                    <button key={label} type="button" className="cp-link" onClick={() => void logout()}>
                      <Icon name={icon} />
                      <span>{label}</span>
                    </button>
                  );
                }
                return (
                  <Link key={href} href={href} prefetch className={`cp-link ${active ? "is-active" : ""}`}>
                    <Icon name={icon} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      {open ? <button className="cp-scrim" type="button" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <div className="cp-main">
        <header className="cp-top">
          <div className="cp-top-title">
            <button type="button" className="cp-icon-btn cp-menu-toggle" aria-label="Toggle sidebar" onClick={() => (window.innerWidth < 980 ? setOpen(true) : setCollapsed((v) => !v))}>
              <Icon name="menu" />
            </button>
            <DashboardBrandLockup theme={light ? "light" : "dark"} compact className="cp-top-mark" />
            <div>
              <p className="cp-crumb">Dashboard / {title}</p>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="cp-top-actions">
            <button type="button" className="cp-icon-btn cp-desk-only" aria-label={light ? "Switch to dark mode" : "Switch to light mode"} aria-pressed={light} onClick={toggleTheme}>
              <Icon name={light ? "moon" : "sun"} />
            </button>
            <button type="button" className="cp-icon-btn cp-desk-only" aria-label="Search" onClick={() => setSearch(true)}>
              <Icon name="search" />
            </button>
            <Link href="/dashboard/notifications" className="cp-icon-btn cp-desk-only" aria-label="Notifications">
              <Icon name="bell" />
              {unread > 0 ? <i className="cp-dot" /> : null}
            </Link>
            <Link href="/dashboard/add-funds" className="cp-balance">
              <span>Balance</span>
              <strong>{formatWalletUsd(user?.balance ?? 0)}</strong>
            </Link>
            <Link href="/dashboard/add-funds" className="cp-add">
              Add Funds
            </Link>
            <div className="cp-profile">
              <button type="button" className="cp-profile-btn cp-desk-only" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-haspopup="menu">
                <Avatar user={user} />
                <span className="cp-profile-name">{name}</span>
              </button>
              <button type="button" className="cp-icon-btn cp-more" aria-label="More" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                <Icon name="more" />
              </button>
              {menu ? (
                <div className="cp-menu" role="menu">
                  <Link href="/dashboard/new-order">New Order</Link>
                  <Link href="/dashboard/add-funds">Add Funds</Link>
                  <Link href="/dashboard/notifications">Notifications{unread > 0 ? ` (${unread})` : ""}</Link>
                  <Link href="/dashboard/profile">My Profile</Link>
                  <Link href="/dashboard/security">Security</Link>
                  <Link href="/dashboard/tickets">Support</Link>
                  <button type="button" onClick={() => setSearch(true)}>Search</button>
                  <button type="button" onClick={toggleTheme}>{light ? "Dark mode" : "Light mode"}</button>
                  <button type="button" onClick={() => void logout()}>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <div className="cp-content">{children}</div>
        <nav className="cp-dock" aria-label="Dashboard">
          <Link href="/dashboard" className={pathname === "/dashboard" ? "is-on" : ""}>
            <Icon name="grid" />
            Home
          </Link>
          <Link href="/dashboard/new-order" className={pathname.startsWith("/dashboard/new-order") ? "is-on" : ""}>
            <Icon name="plus" />
            Order
          </Link>
          <Link href="/dashboard/add-funds" className={pathname.startsWith("/dashboard/add-funds") ? "is-on" : ""}>
            <Icon name="wallet" />
            Funds
          </Link>
          <Link href="/dashboard/orders" className={pathname.startsWith("/dashboard/orders") ? "is-on" : ""}>
            <Icon name="box" />
            Orders
          </Link>
          <button type="button" onClick={() => setOpen(true)}>
            <Icon name="menu" />
            Menu
          </button>
        </nav>
      </div>
      {search ? (
        <div className="cp-modal" role="dialog" aria-label="Search dashboard">
          <button className="cp-scrim" type="button" aria-label="Close search" onClick={() => setSearch(false)} />
          <div className="cp-dialog">
            <input autoFocus placeholder="Search pages" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="cp-results">
              {results.map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setSearch(false)}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ user }: { user: SessionUser | null }) {
  if (user?.image) return <img src={user.image} alt="" width={36} height={36} />;
  const letter = (user?.name || user?.email || "T").charAt(0).toUpperCase();
  return <span>{letter}</span>;
}

function Icon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden width="18" height="18">
      {name === "grid" && <path {...common} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />}
      {name === "plus" && <path {...common} d="M12 5v14M5 12h14" />}
      {name === "layers" && <path {...common} d="M12 3 3 8l9 5 9-5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />}
      {name === "list" && <path {...common} d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />}
      {name === "box" && <path {...common} d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9zM12 12l9-4.5M12 12v9M12 12 3 7.5" />}
      {name === "clock" && <path {...common} d="M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />}
      {name === "star" && <path {...common} d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.8 6.6 19.8l1-6.1L3.2 9.4l6.1-.9L12 3z" />}
      {name === "wallet" && <path {...common} d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19v12H5.5A2.5 2.5 0 0 1 3 15.5v-7zM16 12h4" />}
      {name === "swap" && <path {...common} d="M7 7h11l-3-3M17 17H6l3 3" />}
      {name === "coin" && <path {...common} d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 8v8M9.5 10.5c.6-.8 1.4-1.2 2.5-1.2 1.5 0 2.5.7 2.5 1.8S13.5 13 12 13s-2.5.7-2.5 1.8 1 1.8 2.5 1.8c1.1 0 1.9-.4 2.5-1.2" />}
      {name === "ticket" && <path {...common} d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />}
      {name === "help" && <path {...common} d="M12 17h.01M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.8.3-1.2.8-1.2 1.6V14M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />}
      {name === "code" && <path {...common} d="m8 8-4 4 4 4M16 8l4 4-4 4" />}
      {name === "user" && <path {...common} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0" />}
      {name === "shield" && <path {...common} d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3z" />}
      {name === "bell" && <path {...common} d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16zM10 19a2 2 0 0 0 4 0" />}
      {name === "out" && <path {...common} d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2M4 12h10M7 9l-3 3 3 3" />}
      {name === "menu" && <path {...common} d="M4 7h16M4 12h16M4 17h16" />}
      {name === "search" && <path {...common} d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5" />}
      {name === "sun" && <path {...common} d="M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1 3.5 20.5M20.5 3.5l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />}
      {name === "moon" && <path {...common} d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />}
      {name === "more" && (
        <>
          <circle cx="12" cy="6" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <circle cx="12" cy="18" r="1.6" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
