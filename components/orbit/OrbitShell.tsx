"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { OrbitIcon } from "@/components/orbit/orbit-icons";
import { usd } from "@/components/orbit/orbit-ui";
import { ORBIT_PAGES } from "@/lib/orbit/page-registry";

type NavLink = {
  href: string;
  label: string;
  icon: ComponentProps<typeof OrbitIcon>["name"];
  nested?: boolean;
  exact?: boolean;
};
type NavGroup = { title: string; links: NavLink[] };

const groups: NavGroup[] = [
  {
    title: "Customers",
    links: [
      { href: "/orbit/customers", label: "All customers", icon: "customers" },
      { href: "/orbit/wallet", label: "Customer wallets", icon: "wallet" },
      { href: "/orbit/transactions", label: "Customer activity", icon: "activity" },
    ],
  },
  {
    title: "SMM Management",
    links: [
      { href: "/orbit/services", label: "Services", icon: "services" },
      { href: "/orbit/providers", label: "Providers", icon: "providers" },
    ],
  },
  {
    title: "Orders",
    links: [{ href: "/orbit/orders", label: "All orders", icon: "orders" }],
  },
  {
    title: "Finance",
    links: [
      { href: "/orbit/payments", label: "Banker desk", icon: "banker" },
      { href: "/orbit/wallet", label: "Wallet management", icon: "wallet" },
      { href: "/orbit/transactions", label: "Payment history", icon: "wallet" },
    ],
  },
  {
    title: "Website Control",
    links: [
      { href: "/orbit/pages/home", label: "Homepage builder", icon: "pages" },
      { href: "/orbit/pages", label: "All pages", icon: "pages", exact: true },
      ...ORBIT_PAGES.filter((page) => page.slug !== "home").map((page) => ({
        href: `/orbit/pages/${page.slug}`,
        label: page.label,
        icon: "pages" as const,
        nested: true,
      })),
      { href: "/orbit/blog", label: "Blog CMS", icon: "blog" },
      { href: "/orbit/media", label: "Media library", icon: "media" },
      { href: "/orbit/seo", label: "SEO", icon: "seo" },
    ],
  },
  {
    title: "Support",
    links: [{ href: "/orbit/support", label: "Tickets", icon: "support" }],
  },
];

type HeaderStats = { openTickets: number; walletLiability: number; gatewayLive: boolean };

export function OrbitShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [collapsed, setCollapsed] = useState(false);
  const [closed, setClosed] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [header, setHeader] = useState<HeaderStats>({ openTickets: 0, walletLiability: 0, gatewayLive: false });

  useEffect(() => {
    const saved = localStorage.getItem("trustify-orbit-theme");
    const next = saved === "dark" ? "dark" : "light";
    setTheme(next);
    if (next === "dark") document.documentElement.dataset.orbit = "dark";
    else delete document.documentElement.dataset.orbit;
  }, []);

  useEffect(() => {
    fetch("/api/orbit/overview?range=30")
      .then((response) => response.json())
      .then((body) =>
        setHeader({
          openTickets: body?.stats?.openTickets ?? 0,
          walletLiability: body?.stats?.walletLiability ?? 0,
          gatewayLive: Boolean(body?.gateway?.live),
        }),
      )
      .catch(() => undefined);
  }, [pathname]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("trustify-orbit-theme", next);
    if (next === "dark") document.documentElement.dataset.orbit = "dark";
    else delete document.documentElement.dataset.orbit;
  }

  function linkIsActive(link: NavLink) {
    if (pathname === link.href) return true;
    if (link.exact || link.href === "/orbit") return false;
    return pathname.startsWith(`${link.href}/`);
  }

  const flat = useMemo(() => [{ href: "/orbit", label: "Dashboard", icon: "dashboard" as const }, ...groups.flatMap((group) => group.links)], []);
  const current = flat.find((link) => link.href === pathname);
  const title = current?.label || "Dashboard";
  const query = search.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!query) return groups;
    return groups
      .map((group) => ({
        ...group,
        links: group.links.filter((link) => link.label.toLowerCase().includes(query) || group.title.toLowerCase().includes(query)),
      }))
      .filter((group) => group.links.length > 0);
  }, [query]);

  if (pathname.startsWith("/orbit/login")) return <>{children}</>;

  return (
    <div className={`ob${theme === "dark" ? " is-dark" : ""}${collapsed ? " is-collapsed" : ""}`}>
      <header className="ob-top">
        <Link href="/orbit" className="ob-lockup" aria-label="Orbit home">
          <img src="/brand/icon-trustify-t.png" alt="" />
          <div>
            <strong>
              Trustify<span>SMM</span>
            </strong>
            <small>SMM Panel</small>
          </div>
        </Link>
        <button className="ob-icon-btn" type="button" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
        <label className="ob-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything…  (Ctrl + K)" aria-label="Search modules" />
        </label>
        <div className="ob-actions">
          <Link className="ob-icon-btn" href="/orbit/support" aria-label="Open tickets">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8m-9 12a2 2 0 1 0 4 0" />
            </svg>
            {header.openTickets ? <span className="ob-top-badge">{header.openTickets}</span> : null}
          </Link>
          <span className="ob-chip ob-chip--wallet">{usd(header.walletLiability)}</span>
          <Link className="ob-btn primary ob-top-cta" href="/orbit/payments">
            + Add Funds
          </Link>
          <div className="ob-profile">
            <div className="ob-avatar">AO</div>
            <div className="ob-profile-copy">
              <span>Admin</span>
              <small>Super Admin</small>
            </div>
          </div>
        </div>
      </header>

      <aside className="ob-side">
        <div className="ob-side-badge">Orbit Control Center</div>
        <nav className="ob-nav" aria-label="Orbit modules">
          <Link href="/orbit" className={`ob-link ob-link--home${pathname === "/orbit" ? " is-active" : ""}`}>
            <OrbitIcon name="dashboard" />
            <span className="ob-label">Dashboard</span>
          </Link>
          {filteredGroups.map((group) => {
            const hidden = closed.includes(group.title);
            return (
              <div key={group.title} className="ob-group">
                <button
                  className="ob-group-title"
                  type="button"
                  onClick={() => setClosed((items) => (items.includes(group.title) ? items.filter((item) => item !== group.title) : [...items, group.title]))}
                >
                  <span>{group.title}</span>
                  <span aria-hidden>{hidden ? "+" : "–"}</span>
                </button>
                {hidden ? null : (
                  <div className="ob-links">
                    {group.links.map((link) => (
                      <Link key={`${group.title}-${link.href}-${link.label}`} href={link.href} className={`ob-link${link.nested ? " ob-link--nested" : ""}${linkIsActive(link) ? " is-active" : ""}`}>
                        <OrbitIcon name={link.icon} />
                        <span className="ob-label">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="ob-side-foot">
          <button type="button" className="ob-theme-row" onClick={toggleTheme}>
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <div className="ob-side-user">
            <div className="ob-avatar">AO</div>
            <div>
              <strong>Admin Owner</strong>
              <small>{header.gatewayLive ? "Super Admin · Live" : "Super Admin"}</small>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              fetch("/api/orbit/auth/logout", { method: "POST" }).then(() => {
                window.location.href = "/orbit/login";
              })
            }
          >
            Logout
          </button>
        </div>
      </aside>

      <section className="ob-main">
        {pathname === "/orbit" ? null : (
          <div className="ob-pagehead">
            <p className="ob-crumb">
              Orbit Control Center <span>/</span> {title}
            </p>
            <h1>{title}</h1>
          </div>
        )}
        <div className="ob-content">{children}</div>
      </section>
    </div>
  );
}
