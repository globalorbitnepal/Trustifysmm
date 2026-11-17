"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <div className="cp-grid">
      <section className="cp-card cp-welcome">
        <p className="cp-kicker">TrustifySMM</p>
        <h2>Welcome back, {name || "there"}</h2>
        <p>Manage your social media growth from one powerful dashboard.</p>
        <Link className="cp-btn" href="/dashboard/new-order">New Order</Link>
      </section>
      {error ? <p className="cp-error">{error}</p> : null}
      {!data ? <Skeleton rows={4} /> : (
        <>
          <section className="cp-grid cp-stats">
            <Stat label="Available balance" value={`$${data.balance.toFixed(2)}`} hint={data.currency} href="/dashboard/add-funds" cta="Add funds" />
            <Stat label="Total orders" value={String(data.totalOrders)} hint="All orders on this account" />
            <Stat label="Active orders" value={String(data.activeOrders)} hint="Pending, processing, in progress" />
            <Stat label="Completed orders" value={String(data.completedOrders)} hint="Successfully completed" />
          </section>
          <section className="cp-grid cp-actions">
            {[
              ["/dashboard/new-order", "Place New Order"],
              ["/dashboard/add-funds", "Add Funds"],
              ["/dashboard/orders", "Track Orders"],
              ["/dashboard/tickets", "Create Support Ticket"],
              ["/dashboard/services", "Browse Services"],
              ["/dashboard/transactions", "View Transactions"],
            ].map(([href, label]) => (
              <Link key={href} className="cp-card" href={href}>{label}</Link>
            ))}
          </section>
          <section className="cp-grid cp-split">
            <article className="cp-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <h3>Orders over time</h3>
                <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <Bars points={data.series.orders} />
              <h3>Spending</h3>
              <Bars points={data.series.spend} money />
            </article>
            <article className="cp-card">
              <h3>Status and platforms</h3>
              <Breakdown title="Order status" data={data.series.statuses} />
              <Breakdown title="Platform usage" data={data.series.platforms} />
              {data.totalOrders === 0 ? <Empty title="No orders yet" copy="Your charts fill in after the first order." href="/dashboard/new-order" cta="Place an order" /> : null}
            </article>
          </section>
          <article className="cp-card">
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

export function Stat({ label, value, hint, href, cta }: { label: string; value: string; hint: string; href?: string; cta?: string }) {
  return (
    <article className="cp-card cp-stat">
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
  const entries = Object.entries(data);
  return (
    <div>
      <p className="cp-label">{title}</p>
      {entries.length === 0 ? <p className="cp-note">Nothing to chart yet.</p> : entries.map(([key, value]) => (
        <p key={key} className="cp-meta">{key}: {value}</p>
      ))}
    </div>
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
