"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OrbitHeroArt } from "@/components/orbit/OrbitHeroArt";
import { PlatformBadge } from "@/components/orbit/PlatformBadge";
import { OrbitIcon } from "@/components/orbit/orbit-icons";
import { AreaChart, Donut, QuickAction, StatCard, StatusPill, timeAgo, usd } from "@/components/orbit/orbit-ui";
import { send, useOrbit } from "@/components/orbit/use-orbit";
import type { OrbitSiteConfig } from "@/lib/orbit/types";

type Overview = {
  generatedAt: string;
  savedAt: string;
  stats: Record<string, number>;
  series: { date: string; customers: number; orders: number; revenue: number; deposits: number }[];
  statuses: { status: string; count: number }[];
  platforms: { platform: string; count: number }[];
  topServices: { name: string; orders: number; revenue: number }[];
  recentOrders: { id: number; customer: string; service: string; charge: number; status: string; createdAt?: string }[];
  recentCustomers: { id: string; name: string | null; email: string; createdAt: string }[];
  recentTickets: { id: string; subject: string; status: string; updatedAt: string }[];
  recentTransactions: { id: string; type: string; amount: number; description: string; createdAt: string }[];
  gateway: { live: boolean; currencies: string[] };
  providers: { name: string; lastStatus?: string; enabled: boolean }[];
};

type Traffic = {
  visits: number;
  unique: number;
  change: number;
  sources: { source: string; count: number; pct: number }[];
  paths: { path: string; count: number }[];
};

const donutColors = ["#3b82f6", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
const ranges = [
  { id: "24h", label: "Last 24 Hours" },
  { id: "7", label: "Last 7 Days" },
  { id: "15", label: "Last 15 Days" },
  { id: "30", label: "Last 30 Days" },
  { id: "90", label: "Last 90 Days" },
  { id: "1y", label: "Last 1 Year" },
];

const platformIcons: Record<string, { src?: string; color: string; label: string }> = {
  instagram: { src: "/brand/icon-instagram.png", color: "#a855f7", label: "Instagram" },
  youtube: { src: "/brand/icon-youtube.png", color: "#ef4444", label: "YouTube" },
  tiktok: { src: "/brand/icon-tiktok.png", color: "#111827", label: "TikTok" },
  facebook: { src: "/brand/icon-facebook.png", color: "#2563eb", label: "Facebook" },
  telegram: { src: "/brand/icon-telegram.png", color: "#0ea5e9", label: "Telegram" },
  twitter: { src: "/brand/icon-x.png", color: "#1f2937", label: "X / Twitter" },
  x: { src: "/brand/icon-x.png", color: "#1f2937", label: "X / Twitter" },
  whatsapp: { src: "/brand/icon-whatsapp.png", color: "#22c55e", label: "WhatsApp" },
  snapchat: { src: "/brand/icon-snapchat.png", color: "#eab308", label: "Snapchat" },
  threads: { src: "/brand/icon-threads.png", color: "#334155", label: "Threads" },
};

export function DashboardScreen() {
  const [range, setRange] = useState("30");
  const { data, error, loading } = useOrbit<Overview>(`/api/orbit/overview?range=${range}`);
  const traffic = useOrbit<Traffic>(`/api/orbit/traffic?range=${range}`);
  const site = useOrbit<OrbitSiteConfig>("/api/orbit/config");
  const dash = site.data?.orbitDashboard;

  const statusSlices = useMemo(() => {
    const raw = (data?.statuses ?? []).slice(0, 5).map((row, index) => ({
      label: row.status,
      value: row.count,
      color: donutColors[index % donutColors.length],
    }));
    if (raw.length) return raw;
    return [
      { label: "Completed", value: 0, color: "#3b82f6" },
      { label: "Processing", value: 0, color: "#14b8a6" },
      { label: "Pending", value: 0, color: "#f59e0b" },
      { label: "Cancelled", value: 0, color: "#ec4899" },
    ];
  }, [data]);

  const platformRows = useMemo(() => {
    const list = data?.platforms ?? [];
    const total = list.reduce((s, r) => s + r.count, 0) || 1;
    const max = Math.max(1, ...list.map((r) => r.count));
    if (list.length) {
      return list.slice(0, 5).map((r) => {
        const key = r.platform.toLowerCase();
        const meta = platformIcons[key] ?? { color: "#6d3df0", label: r.platform };
        return {
          key: r.platform,
          label: meta.label,
          src: meta.src,
          color: meta.color,
          count: r.count,
          pct: Math.round((r.count / total) * 1000) / 10,
          bar: Math.max(8, (r.count / max) * 100),
        };
      });
    }
    return (["instagram", "youtube", "tiktok", "facebook"] as const).map((k) => ({
      key: k,
      label: platformIcons[k].label,
      src: platformIcons[k].src,
      color: platformIcons[k].color,
      count: 0,
      pct: 0,
      bar: 6,
    }));
  }, [data]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const activityItems = useMemo(() => {
    const out: { id: string; dot: string; text: string; when: string }[] = [];
    for (const o of (data?.recentOrders ?? []).slice(0, 2)) {
      out.push({ id: `ord-${o.id}`, dot: "#3b82f6", text: `New order #TS-${o.id} placed (${o.service})`, when: o.createdAt ? timeAgo(o.createdAt) : "recent" });
    }
    for (const t of (data?.recentTransactions ?? []).slice(0, 2)) {
      out.push({ id: `tx-${t.id}`, dot: "#14b8a6", text: `${t.type === "deposit" ? "Deposit received" : "Wallet update"}: ${usd(t.amount)}`, when: timeAgo(t.createdAt) });
    }
    for (const k of (data?.recentTickets ?? []).slice(0, 1)) {
      out.push({ id: `tk-${k.id}`, dot: "#8b5cf6", text: `Support ticket opened: ${k.subject}`, when: timeAgo(k.updatedAt) });
    }
    for (const c of (data?.recentCustomers ?? []).slice(0, 1)) {
      out.push({ id: `cu-${c.id}`, dot: "#ec4899", text: `New customer registered (${c.email})`, when: timeAgo(c.createdAt) });
    }
    return out.slice(0, 5);
  }, [data]);

  return (
    <div className="ob-home">
      <section className="ob-hero">
        <div className="ob-hero-copy">
          <h2>
            {dash?.welcomePrefix || "Welcome back,"} <span>{dash?.welcomeName || "Admin Owner"}</span> 👋
          </h2>
          <p>{dash?.welcomeLede || "Manage your entire TrustifySMM business from one powerful dashboard."}</p>
          <div className="ob-hero-meta">
            <span>📅 {loading ? "Syncing…" : dateStr}</span>
            <span>🕒 {timeStr}</span>
            <span className="ob-online-dot">
              <i style={{ background: data?.gateway.live ? "#22c55e" : "#f59e0b" }} />
              {data?.gateway.live ? "System Online" : "System Online · Gateway Pending"}
            </span>
          </div>
        </div>
        <div className="ob-hero-visual" aria-hidden>
          {dash?.heroArt ? <img src={dash.heroArt} alt="" /> : <OrbitHeroArt className="ob-hero-art-svg" />}
        </div>
      </section>
      {error ? <p className="ob-error">{error}</p> : null}

      <div className="ob-stat-grid ob-stat-grid--5">
        <StatCard
          tone="purple"
          label="Total Customers"
          value={(data?.stats.customers ?? 0).toLocaleString()}
          hint={`${data?.stats.customersToday ?? 0} today`}
          icon={<OrbitIcon name="customers" />}
        />
        <StatCard
          tone="blue"
          label="New Customers Today"
          value={(data?.stats.customersToday ?? 0).toLocaleString()}
          hint={`${data?.stats.customersInRange ?? 0} in range`}
          icon={<OrbitIcon name="userPlus" />}
        />
        <StatCard
          tone="pink"
          label="Total Orders"
          value={(data?.stats.orders ?? 0).toLocaleString()}
          hint={`${data?.stats.completedOrders ?? 0} done`}
          icon={<OrbitIcon name="orders" />}
        />
        <StatCard
          tone="cyan"
          label="Orders Today"
          value={(data?.stats.ordersToday ?? 0).toLocaleString()}
          hint={`${data?.stats.ordersInRange ?? 0} in range`}
          icon={<OrbitIcon name="bolt" />}
        />
        <StatCard
          tone="green"
          label="Active Orders"
          value={(data?.stats.activeOrders ?? 0).toLocaleString()}
          hint="Live queue"
          icon={<OrbitIcon name="check" />}
        />
      </div>

      <div className="ob-dash-mid">
        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3 className="ob-sec-title">
              <OrbitIcon name="activity" /> Revenue Overview
            </h3>
            <select className="ob-range-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Time range">
              {ranges.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="ob-rev-row">
            <strong className="ob-rev">{data ? usd(data.stats.revenue) : "$0.00"}</strong>
            <span className="ob-rev-delta">↑ Deposits {data ? usd(data.stats.deposits) : "$0.00"}</span>
          </div>
          <AreaChart series={data?.series ?? []} keys={["revenue", "deposits"]} />
        </article>

        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3 className="ob-sec-title">
              <OrbitIcon name="orders" /> Order Status Distribution
            </h3>
          </div>
          <Donut
            slices={statusSlices}
            centerValue={(data?.stats.orders ?? 0).toLocaleString()}
            centerLabel="Total Orders"
          />
        </article>

        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3 className="ob-sec-title">
              <OrbitIcon name="activity" /> Top Platforms
            </h3>
            <select className="ob-range-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Platform range">
              {ranges.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="ob-plat-list">
            {platformRows.map((row) => (
              <div key={row.key} className="ob-plat-row">
                <PlatformBadge id={row.key} />
                <div className="ob-plat-mid">
                  <div className="ob-plat-top">
                    <strong>{row.label}</strong>
                    <span>
                      <b>{row.count.toLocaleString()}</b> <em>{row.pct}%</em>
                    </span>
                  </div>
                  <i className="ob-plat-track">
                    <b style={{ width: `${row.bar}%`, background: row.color }} />
                  </i>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="ob-dash-low">
        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <div>
              <h3 className="ob-sec-title"><OrbitIcon name="bolt" /> Quick Actions</h3>
              <p className="ob-sub">Get started with these powerful tools.</p>
            </div>
            <Link className="ob-view-all" href="/orbit/services">View All →</Link>
          </div>
          <div className="ob-quick-grid ob-quick-grid--6">
            <QuickAction tone="purple" href="/orbit/orders" label="Place New Order" icon={<OrbitIcon name="orders" />} />
            <QuickAction tone="blue" href="/orbit/payments" label="Add Funds" icon={<OrbitIcon name="wallet" />} />
            <QuickAction tone="green" href="/orbit/orders" label="Track Orders" icon={<OrbitIcon name="pulse" />} />
            <QuickAction tone="pink" href="/orbit/support" label="Create Ticket" icon={<OrbitIcon name="support" />} />
            <QuickAction tone="amber" href="/orbit/services" label="Browse Services" icon={<OrbitIcon name="grid" />} />
            <QuickAction tone="cyan" href="#traffic" label="View Analytics" icon={<OrbitIcon name="activity" />} />
          </div>
        </article>

        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3 className="ob-sec-title"><OrbitIcon name="orders" /> Recent Orders</h3>
            <Link className="ob-view-all" href="/orbit/orders">View All →</Link>
          </div>
          <div className="ob-table-wrap" style={{ boxShadow: "none", border: 0 }}>
            <table className="ob-table ob-table--compact">
              <thead>
                <tr><th>Order ID</th><th>Service</th><th>Status</th><th>Amount</th><th>Date</th></tr>
              </thead>
              <tbody>
                {data?.recentOrders.length ? data.recentOrders.slice(0, 4).map((row) => (
                  <tr key={row.id}>
                    <td><strong>#TS-{row.id}</strong></td>
                    <td className="ob-ellipsis">{row.service}</td>
                    <td><StatusPill status={row.status} /></td>
                    <td><strong>{usd(row.charge)}</strong></td>
                    <td className="ob-muted">{row.createdAt ? timeAgo(row.createdAt) : "—"}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="ob-muted">No orders recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3 className="ob-sec-title"><OrbitIcon name="pulse" /> Latest Activity</h3>
            <Link className="ob-view-all" href="/orbit/activity">View All →</Link>
          </div>
          <ul className="ob-timeline">
            {activityItems.length ? activityItems.map((item) => (
              <li key={item.id}>
                <i style={{ background: item.dot }} />
                <p>{item.text}</p>
                <span>{item.when}</span>
              </li>
            )) : <li className="ob-muted">No activity recorded yet.</li>}
          </ul>
        </article>
      </div>

      <article className="ob-panel ob-card" id="traffic">
        <div className="ob-panel-head">
          <div>
            <h3 className="ob-sec-title"><OrbitIcon name="activity" /> Live Traffic Analytics — Visitor Sources</h3>
            <p className="ob-sub">Real public visits tracked across Direct, Google, Instagram, TikTok, YouTube, Telegram &amp; referrals.</p>
          </div>
          <div className="ob-chart-tabs ob-chart-tabs--wrap">
            {ranges.map((item) => (
              <button key={item.id} className={range === item.id ? "is-on" : ""} type="button" onClick={() => setRange(item.id)}>
                {item.label.replace("Last ", "")}
              </button>
            ))}
          </div>
        </div>
        <div className="ob-traffic-summary">
          <div><span>Total Visits</span><strong>{traffic.data?.visits ?? 0}</strong></div>
          <div><span>Unique Visitors</span><strong>{traffic.data?.unique ?? 0}</strong></div>
          <div><span>vs Previous Window</span><strong>{traffic.data?.change ? `${traffic.data.change > 0 ? "+" : ""}${traffic.data.change}%` : "0%"}</strong></div>
        </div>
        <div className="ob-traffic-grid">
          <div className="ob-bars">
            {(traffic.data?.sources ?? []).map((row) => (
              <div key={row.source} className="ob-bar-row">
                <span>{row.source}</span>
                <i><b style={{ width: `${Math.max(8, row.pct)}%` }} /></i>
                <em>{row.count} · {row.pct}%</em>
              </div>
            ))}
            {!traffic.data?.sources.length ? <p className="ob-muted">No public visits recorded in this window yet.</p> : null}
          </div>
          <table className="ob-table ob-table--compact">
            <thead><tr><th>Top Landing Pages</th><th>Views</th></tr></thead>
            <tbody>
              {(traffic.data?.paths ?? []).map((row) => (
                <tr key={row.path}><td><code className="ob-url">{row.path}</code></td><td><strong>{row.count}</strong></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

type Customer = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  createdAt: string;
  balance: number;
  orders: number;
  spending: number;
  suspended: boolean;
  apiKeyRevoked: boolean;
  lastLogin: string | null;
};

export function CustomersScreen() {
  const { data, error, reload } = useOrbit<{ customers: Customer[] }>("/api/orbit/customers");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const rows = (data?.customers || []).filter((row) => `${row.name} ${row.email} ${row.username}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <form className="ob-form" onSubmit={async (event) => {
        event.preventDefault();
        setMessage("");
        try {
          await send("/api/orbit/customers", form);
          setForm({ name: "", email: "", password: "" });
          reload();
        } catch (reason) {
          setMessage(reason instanceof Error ? reason.message : "Could not create customer");
        }
      }}>
        <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
        <button className="ob-btn primary" type="submit">Add customer</button>
        <button className="ob-btn" type="button" onClick={() => downloadCsv(rows)}>Export</button>
      </form>
      {message ? <p className="ob-error">{message}</p> : null}
      {error ? <p className="ob-error">{error}</p> : null}
      <input placeholder="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Balance</th><th>Orders</th><th>Spend</th><th>Status</th><th>Last login</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name || "—"}</td>
                <td>{row.email}</td>
                <td>{row.createdAt.slice(0, 10)}</td>
                <td>{usd(row.balance)}</td>
                <td>{row.orders}</td>
                <td>{usd(row.spending)}</td>
                <td>{row.suspended ? "Suspended" : row.apiKeyRevoked ? "API revoked" : "Active"}</td>
                <td>{row.lastLogin ? row.lastLogin.slice(0, 16).replace("T", " ") : "—"}</td>
                <td><Link href={`/orbit/customers/${row.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function WalletScreen() {
  const { data, reload } = useOrbit<{ customers: Customer[] }>("/api/orbit/customers");
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  async function adjust(direction: "credit" | "debit") {
    setMessage("");
    const value = Number(amount);
    if (!userId) {
      setMessage("Select a customer.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter an amount greater than zero.");
      return;
    }
    if (reason.trim().length < 3) {
      setMessage("Enter a reason of at least 3 characters.");
      return;
    }
    try {
      await send("/api/orbit/customers", { userId, direction, amount: value, reason, reference }, "PATCH");
      setAmount("");
      setReason("");
      reload();
      setMessage(direction === "credit" ? "Balance credited and written to the ledger." : "Balance debited and written to the ledger.");
    } catch (reasonError) {
      setMessage(reasonError instanceof Error ? reasonError.message : "Wallet update failed");
    }
  }
  return (
    <form className="ob-form" onSubmit={(event) => event.preventDefault()}>
      <label>Customer
        <select value={userId} onChange={(event) => setUserId(event.target.value)} required>
          <option value="">Select</option>
          {data?.customers.map((row) => <option key={row.id} value={row.id}>{row.email} · {usd(row.balance)}</option>)}
        </select>
      </label>
      <label>Amount USD<input value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
      <label>Reason<input value={reason} onChange={(event) => setReason(event.target.value)} required /></label>
      <label>Reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional, blocks duplicates" /></label>
      <button className="ob-btn primary" type="button" onClick={() => adjust("credit")}>Credit</button>
      <button className="ob-btn" type="button" onClick={() => adjust("debit")}>Debit</button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}

function downloadCsv(rows: Customer[]) {
  const header = "email,name,balance,orders,spending,status";
  const body = rows.map((row) => [row.email, row.name, row.balance, row.orders, row.spending, row.suspended ? "suspended" : "active"].join(","));
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "trustify-customers.csv";
  link.click();
  URL.revokeObjectURL(url);
}
