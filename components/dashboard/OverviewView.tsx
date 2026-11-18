"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHeroPlatforms } from "@/components/dashboard/DashboardHeroPlatforms";

type Overview = {
  balance: number;
  currency: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  recent: { id: number; service: string; charge: number; status: string; createdAt: string }[];
  series: {
    orders: { day: string; value: number }[];
    spend: { day: string; value: number }[];
    statuses: Record<string, number>;
    platforms: Record<string, number>;
  };
};

const QUICK = [
  { href: "/dashboard/new-order", label: "Place New Order", hint: "Start a new campaign", icon: "plus" as const, tone: "violet" as const },
  { href: "/dashboard/add-funds", label: "Add Funds", hint: "Top up wallet balance", icon: "wallet" as const, tone: "blue" as const },
  { href: "/dashboard/orders", label: "Track Orders", hint: "Live status & history", icon: "box" as const, tone: "indigo" as const },
  { href: "/dashboard/tickets", label: "Support Ticket", hint: "Priority help desk", icon: "ticket" as const, tone: "pink" as const },
  { href: "/dashboard/services", label: "Browse Services", hint: "Catalog by platform", icon: "layers" as const, tone: "cyan" as const },
  { href: "/dashboard/transactions", label: "Transactions", hint: "Payments & ledger", icon: "swap" as const, tone: "emerald" as const },
];

export function OverviewView({ name }: { name?: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [range, setRange] = useState("30");
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/dashboard/overview?range=${range}`);
      if (!res.ok) {
        setError("Could not load your dashboard.");
        return;
      }
      setData((await res.json()) as Overview);
    })();
  }, [range]);

  return (
    <div className="cp-home">
      <section className="cp-card cp-hero-glass">
        <div className="cp-hero-glass-bg" aria-hidden />
        <div className="cp-hero-glass-body">
          <p className="cp-kicker">Customer panel</p>
          <h2>Welcome back, {name || "there"}</h2>
          <p>Grow on every major platform — orders, wallet and support in one premium workspace.</p>
          <div className="cp-hero-actions">
            <Link className="cp-btn cp-hero-primary" href="/dashboard/new-order">New Order</Link>
            <Link className="cp-btn-ghost cp-hero-ghost" href="/dashboard/add-funds">Add Funds</Link>
          </div>
        </div>
        <DashboardHeroPlatforms />
      </section>
      {error ? <p className="cp-error">{error}</p> : null}
      {!data ? <Skeleton rows={4} /> : (
        <>
          <section className="cp-grid cp-stats cp-stats-glass">
            <Stat label="Available balance" value={`$${data.balance.toFixed(4)}`} hint={data.currency} href="/dashboard/add-funds" cta="Add funds" accent />
            <Stat label="Total orders" value={String(data.totalOrders)} hint="All orders on this account" />
            <Stat label="Active orders" value={String(data.activeOrders)} hint="Pending · processing · in progress" />
            <Stat label="Completed" value={String(data.completedOrders)} hint="Successfully delivered" />
          </section>
          <section className="cp-actions-section">
            <header className="cp-section-head">
              <h3>Quick actions</h3>
              <p>Secure shortcuts to orders, wallet, and support.</p>
            </header>
            <div className="cp-grid cp-actions cp-actions-glass">
              {QUICK.map((item) => (
                <Link key={item.href} className="cp-card cp-action-tile" href={item.href}>
                  <QuickIcon name={item.icon} tone={item.tone} />
                  <span className="cp-action-copy">
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <span className="cp-action-chevron" aria-hidden>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </section>
          <section className="cp-grid cp-split">
            <article className="cp-card cp-glass-panel">
              <div className="cp-panel-head">
                <h3>Orders over time</h3>
                <select className="cp-range" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <Bars points={data.series.orders} />
              <h3 className="cp-subhead">Spending</h3>
              <Bars points={data.series.spend} money />
            </article>
            <article className="cp-card cp-glass-panel">
              <h3>Status &amp; platforms</h3>
              <Breakdown title="Order status" data={data.series.statuses} />
              <Breakdown title="Platform usage" data={data.series.platforms} />
              {data.totalOrders === 0 ? <Empty title="No orders yet" copy="Your charts fill in after the first order." href="/dashboard/new-order" cta="Place an order" /> : null}
            </article>
          </section>
          <article className="cp-card cp-glass-panel">
            <h3>Recent orders</h3>
            {data.recent.length === 0 ? <Empty title="No orders yet" copy="Services you buy will show up here." href="/dashboard/services" cta="Browse services" /> : (
              <div className="cp-table-wrap">
                <table className="cp-table">
                  <thead><tr><th>Order</th><th>Service</th><th>Charge</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.recent.map((order) => (
                      <tr key={order.id}>
                        <td data-label="Order"><Link href={`/dashboard/orders/${order.id}`}>#{order.id}</Link></td>
                        <td data-label="Service">{order.service}</td>
                        <td data-label="Charge">${order.charge.toFixed(4)}</td>
                        <td data-label="Status"><Badge status={order.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </>
      )}
    </div>
  );
}

export function Stat({ label, value, hint, href, cta, accent }: { label: string; value: string; hint: string; href?: string; cta?: string; accent?: boolean }) {
  return (
    <article className={`cp-card cp-stat cp-stat-glass${accent ? " is-accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <span>{hint}</span>
      {href && cta ? <Link href={href}>{cta}</Link> : null}
    </article>
  );
}

export function Badge({ status }: { status: string }) {
  const label = status === "Canceled" ? "Cancelled" : status;
  const tone = status === "Completed" ? "done" : status === "Failed" || status === "Canceled" ? "bad" : status === "Partial" ? "warn" : "";
  return <span className={`cp-badge ${tone}`}>{label}</span>;
}

export function Empty({ title, copy, href, cta }: { title: string; copy: string; href?: string; cta?: string }) {
  return (
    <div className="cp-empty">
      <h3>{title}</h3>
      <p>{copy}</p>
      {href && cta ? <Link className="cp-btn" href={href}>{cta}</Link> : null}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="cp-grid">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="cp-skel" />)}
    </div>
  );
}

function Bars({ points, money }: { points: { day: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const w = 640;
  const h = 160;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const d = points.map((point, i) => `${i === 0 ? "M" : "L"}${i * step},${h - (point.value / max) * (h - 16)}`).join(" ");
  if (points.every((point) => point.value === 0)) return <p className="cp-note">No activity in this range.</p>;
  return (
    <svg className="cp-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={money ? "Spending chart" : "Orders chart"}>
      <path d={d} fill="none" stroke={`url(#${money ? "cpg-spend" : "cpg-orders"})`} strokeWidth="3" />
      <defs>
        <linearGradient id={money ? "cpg-spend" : "cpg-orders"} x1="0" x2="1">
          <stop stopColor="#762CFF" />
          <stop offset="1" stopColor="#287BFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="cp-breakdown">
      <p className="cp-label">{title}</p>
      {entries.length === 0 ? <p className="cp-note">Nothing to chart yet.</p> : (
        <ul className="cp-breakdown-list">
          {entries.map(([key, value]) => (
            <li key={key}>
              <span className="cp-breakdown-label">{key}</span>
              <span className="cp-breakdown-bar"><i style={{ width: `${(value / max) * 100}%` }} /></span>
              <strong>{value}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickIcon({
  name,
  tone,
}: {
  name: (typeof QUICK)[number]["icon"];
  tone: (typeof QUICK)[number]["tone"];
}) {
  const paths: Record<string, string> = {
    plus: "M12 5v14M5 12h14",
    wallet: "M4 8h16v11H4V8Zm0-3h10a3 3 0 013 3",
    box: "M4 7l8-4 8 4v10l-8 4-8-4V7Z",
    ticket: "M5 9h14v3a3 3 0 01-3 3h-1v5l-3-2-3 2v-5H8a3 3 0 01-3-3V9Z",
    layers: "M12 4 4 8l8 4 8-4-8-4Zm0 8-8 4 8 4 8-4-8-4Z",
    swap: "M7 7h12M17 17H5M17 7l3-3M7 17l-3 3",
  };
  return (
    <span className={`cp-action-ico cp-action-ico--${tone}`} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path d={paths[name]} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function useSessionName() {
  const [name, setName] = useState("there");
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard/session");
      if (!res.ok) return;
      const data = (await res.json()) as { user: { name: string | null; email: string } };
      setName(data.user.name?.split(" ")[0] || data.user.email.split("@")[0]);
    })();
  }, []);
  return name;
}