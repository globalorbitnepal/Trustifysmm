"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  countries: { code: string; name: string; count: number; pct: number }[];
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
      <section className="ob-hero ob-hero--command">
        <div className="ob-hero-copy">
          <p className="ob-hero-eyebrow">Control center</p>
          <h2>
            {dash?.welcomePrefix || "Welcome back,"} <span>{dash?.welcomeName || "Admin Owner"}</span>
          </h2>
          <div className="ob-hero-kpis" role="list">
            <div role="listitem">
              <span>Wallet liability</span>
              <strong>{usd(data?.stats.walletLiability ?? 0)}</strong>
            </div>
            <div role="listitem">
              <span>Revenue</span>
              <strong>{usd(data?.stats.revenue ?? 0)}</strong>
            </div>
            <div role="listitem">
              <span>Open tickets</span>
              <strong>{(data?.stats.openTickets ?? 0).toLocaleString()}</strong>
            </div>
            <div role="listitem">
              <span>Gateway</span>
              <strong className={data?.gateway.live ? "is-live" : "is-warn"}>
                {data?.gateway.live ? "Live" : "Pending"}
              </strong>
            </div>
          </div>
          <div className="ob-hero-meta">
            <span>{loading ? "Syncing…" : dateStr}</span>
            <span aria-hidden>·</span>
            <span>{timeStr}</span>
            <span aria-hidden>·</span>
            <Link href="/orbit/payments" className="ob-hero-link">Payments →</Link>
            <Link href="/orbit/activity" className="ob-hero-link">Activity →</Link>
          </div>
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
        <div className="ob-traffic-grid ob-traffic-grid--3">
          <div className="ob-bars">
            <h4 className="ob-traffic-h">Visitor sources</h4>
            {(traffic.data?.sources ?? []).map((row) => (
              <div key={row.source} className="ob-bar-row">
                <span>{row.source}</span>
                <i><b style={{ width: `${Math.max(8, row.pct)}%` }} /></i>
                <em>{row.count} · {row.pct}%</em>
              </div>
            ))}
            {!traffic.data?.sources.length ? <p className="ob-muted">No public visits recorded in this window yet.</p> : null}
          </div>
          <div className="ob-bars">
            <h4 className="ob-traffic-h">Top countries</h4>
            {(traffic.data?.countries ?? []).length ? (traffic.data?.countries ?? []).map((row) => (
              <div key={row.code} className="ob-bar-row">
                <span>{row.name}</span>
                <i><b style={{ width: `${Math.max(8, row.pct)}%` }} /></i>
                <em>{row.count} · {row.pct}%</em>
              </div>
            )) : <p className="ob-muted">Country data appears once the CDN sends geo headers.</p>}
          </div>
          <table className="ob-table ob-table--compact">
            <thead><tr><th>Top landing pages</th><th>Views</th></tr></thead>
            <tbody>
              {(traffic.data?.paths ?? []).map((row) => (
                <tr key={row.path}><td data-label="Page"><code className="ob-url">{row.path}</code></td><td data-label="Views"><strong>{row.count}</strong></td></tr>
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
  deposits?: number;
  refunds?: number;
  suspended: boolean;
  apiKeyRevoked: boolean;
  lastLogin: string | null;
  lastIp?: string | null;
  lastMethod?: string | null;
  google?: boolean;
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
      <div className="ob-toolbar">
        <input placeholder="Search name, email or username" value={query} onChange={(event) => setQuery(event.target.value)} style={{ flex: 1, minWidth: 0 }} />
        <span className="ob-muted">{rows.length} customer{rows.length === 1 ? "" : "s"}</span>
      </div>
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>Customer</th><th>Signup</th><th>Joined</th><th>Balance</th><th>Orders</th><th>Spend</th><th>Status</th><th>Last login / IP</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td data-label="Customer">
                  <strong>{row.name || row.email.split("@")[0]}</strong>
                  <br /><span className="ob-muted">{row.email}</span>
                </td>
                <td data-label="Signup">{row.google ? "Google" : "Email"}</td>
                <td data-label="Joined">{row.createdAt.slice(0, 10)}</td>
                <td data-label="Balance"><strong>{usd(row.balance)}</strong></td>
                <td data-label="Orders">{row.orders}</td>
                <td data-label="Spend">{usd(row.spending)}</td>
                <td data-label="Status">
                  <span className={`ob-cust-tag is-${row.suspended || row.apiKeyRevoked ? "bad" : "good"}`}>
                    {row.suspended ? "Suspended" : row.apiKeyRevoked ? "API revoked" : "Active"}
                  </span>
                </td>
                <td data-label="Last login">
                  {row.lastLogin ? row.lastLogin.slice(0, 16).replace("T", " ") : "—"}
                  {row.lastIp ? <><br /><code className="ob-url">{row.lastIp}</code></> : null}
                </td>
                <td data-label="Open"><Link className="ob-btn primary" href={`/orbit/customers/${row.id}`}>Open</Link></td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={9} className="ob-muted">No customers match that search.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function WalletScreen() {
  const { data, error, reload } = useOrbit<{ customers: Customer[] }>("/api/orbit/customers");
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"credit" | "debit" | "">("");
  const selected = data?.customers.find((row) => row.id === userId) ?? null;

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
    setBusy(direction);
    try {
      const result = await send<{ balance?: number }>(
        "/api/orbit/customers",
        { userId, direction, amount: value, reason, reference },
        "PATCH",
      );
      setAmount("");
      setReason("");
      reload();
      setMessage(
        `${direction === "credit" ? "Credited" : "Debited"} ${usd(value)} ${direction === "credit" ? "to" : "from"} ${
          selected?.email ?? "the customer"
        }. New balance ${usd(Number(result?.balance ?? 0))}.`,
      );
    } catch (reasonError) {
      setMessage(reasonError instanceof Error ? reasonError.message : "Wallet update failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <form className="ob-form" onSubmit={(event) => event.preventDefault()}>
        <label>Customer
          <select value={userId} onChange={(event) => setUserId(event.target.value)} required>
            <option value="">Select</option>
            {data?.customers.map((row) => <option key={row.id} value={row.id}>{row.email} · {usd(row.balance)}</option>)}
          </select>
        </label>
        <label>Amount USD<input value={amount} onChange={(event) => setAmount(event.target.value)} required inputMode="decimal" /></label>
        <label>Reason<input value={reason} onChange={(event) => setReason(event.target.value)} required /></label>
        <label>Reference<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional, blocks duplicates" /></label>
        <button className="ob-btn primary" type="button" disabled={busy !== ""} onClick={() => void adjust("credit")}>
          {busy === "credit" ? "Crediting…" : "Credit"}
        </button>
        <button className="ob-btn" type="button" disabled={busy !== ""} onClick={() => void adjust("debit")}>
          {busy === "debit" ? "Debiting…" : "Debit"}
        </button>
        {message ? <p className={message.startsWith("Credited") || message.startsWith("Debited") ? "ob-note" : "ob-error"}>{message}</p> : null}
      </form>

      {error ? <p className="ob-error">{error}</p> : null}
      <p className="ob-muted">
        {data ? `${data.customers.length} customers` : "Loading customers…"} · Every customer has a wallet. Credit and debit are written to the ledger with the reason and admin name.
      </p>
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>Customer</th><th>Wallet balance</th><th>Spent</th><th>Deposits</th><th>Refunds</th><th>Status</th></tr></thead>
          <tbody>
            {data?.customers.map((row) => (
              <tr key={row.id} className={row.id === userId ? "is-selected" : undefined} onClick={() => setUserId(row.id)} style={{ cursor: "pointer" }}>
                <td>{row.email}</td>
                <td>{usd(row.balance)}</td>
                <td>{usd(row.spending)}</td>
                <td>{usd(row.deposits ?? 0)}</td>
                <td>{usd(row.refunds ?? 0)}</td>
                <td>{row.suspended ? "Suspended" : row.apiKeyRevoked ? "Key revoked" : "Active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
