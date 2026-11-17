"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { OrbitIcon } from "@/components/orbit/orbit-icons";
import { AreaChart, Donut, QuickAction, StatCard, StatusPill, timeAgo, usd } from "@/components/orbit/orbit-ui";
import { send, useOrbit } from "@/components/orbit/use-orbit";

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

const donutColors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#9aa6c9"];
const ranges = [
  { id: "24h", label: "24 hrs" },
  { id: "7", label: "7 days" },
  { id: "15", label: "15 days" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "1y", label: "1 year" },
];

export function DashboardScreen() {
  const [range, setRange] = useState("30");
  const { data, error, loading } = useOrbit<Overview>(`/api/orbit/overview?range=${range}`);
  const traffic = useOrbit<Traffic>(`/api/orbit/traffic?range=${range}`);
  const orderSpark = useMemo(() => data?.series.slice(-10).map((row) => row.orders) ?? [], [data]);
  const customerSpark = useMemo(() => data?.series.slice(-10).map((row) => row.customers) ?? [], [data]);
  const statusSlices = (data?.statuses ?? []).slice(0, 6).map((row, index) => ({
    label: row.status,
    value: row.count,
    color: donutColors[index % donutColors.length],
  }));
  const statusTotal = statusSlices.reduce((sum, row) => sum + row.value, 0);
  const platformMax = Math.max(1, ...(data?.platforms ?? []).map((row) => row.count));

  return (
    <div className="ob-home">
      <section className="ob-hero">
        <div className="ob-hero-copy">
          <span className="ob-hero-tag">Orbit Control Center</span>
          <h2>Welcome back, Admin Owner 👋</h2>
          <p>Manage your entire TrustifySMM business from one powerful dashboard.</p>
          <div className="ob-hero-meta">
            <span className="ob-hero-pill">{loading ? "Loading live data…" : new Date().toLocaleString()}</span>
            <span className="ob-hero-pill">{data?.gateway.live ? "● System online" : "● Gateway setup needed"}</span>
            <span className="ob-hero-pill">{traffic.data?.visits ?? 0} site visits in range</span>
          </div>
        </div>
        <div className="ob-hero-art" aria-hidden>
          <span className="ob-orb ob-orb--a" />
          <span className="ob-orb ob-orb--b" />
          <span className="ob-orb ob-orb--c" />
          <div className="ob-hero-card">
            <span>Live revenue</span>
            <strong>{data ? usd(data.stats.revenue) : "—"}</strong>
            <small>{ranges.find((row) => row.id === range)?.label}</small>
          </div>
        </div>
      </section>
      {error ? <p className="ob-error">{error}</p> : null}

      <div className="ob-stat-grid ob-stat-grid--5">
        <StatCard label="Total Customers" value={String(data?.stats.customers ?? "—")} hint={`+${data?.stats.customersToday ?? 0} today`} spark={customerSpark} icon={<OrbitIcon name="customers" />} />
        <StatCard label="New Customers" value={String(data?.stats.customersInRange ?? data?.stats.customersToday ?? "—")} hint="In selected range" spark={customerSpark} icon={<OrbitIcon name="customers" />} />
        <StatCard label="Total Orders" value={String(data?.stats.orders ?? "—")} hint={`+${data?.stats.ordersToday ?? 0} today`} spark={orderSpark} icon={<OrbitIcon name="orders" />} />
        <StatCard label="Orders in range" value={String(data?.stats.ordersInRange ?? data?.stats.ordersToday ?? "—")} hint="Tracked volume" spark={orderSpark} icon={<OrbitIcon name="activity" />} />
        <StatCard label="Active Orders" value={String(data?.stats.activeOrders ?? "—")} hint={`${data?.stats.completedOrders ?? 0} completed`} spark={orderSpark} icon={<OrbitIcon name="services" />} />
      </div>

      <div className="ob-dash-mid">
        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <div>
              <h3>Revenue Overview</h3>
              <strong className="ob-rev">{data ? usd(data.stats.revenue) : "—"}</strong>
              <p className="ob-muted" style={{ margin: "2px 0 0" }}>{ranges.find((row) => row.id === range)?.label} · deposits {data ? usd(data.stats.deposits) : "—"}</p>
            </div>
            <div className="ob-chart-tabs ob-chart-tabs--wrap">
              {ranges.map((item) => (
                <button key={item.id} className={range === item.id ? "is-on" : ""} type="button" onClick={() => setRange(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <AreaChart series={data?.series ?? []} keys={["revenue", "deposits"]} />
        </article>
        <article className="ob-panel ob-card">
          <h3>Order Status Distribution</h3>
          {statusSlices.length ? <Donut slices={statusSlices} /> : <p className="ob-muted">No orders in this range.</p>}
          {statusTotal ? <p className="ob-muted" style={{ marginTop: 8 }}>{statusTotal} orders in view</p> : null}
        </article>
        <article className="ob-panel ob-card">
          <h3>Top Platforms</h3>
          <div className="ob-bars">
            {(data?.platforms ?? []).slice(0, 6).map((row) => (
              <div key={row.platform} className="ob-bar-row">
                <span>{row.platform}</span>
                <i><b style={{ width: `${Math.max(8, (row.count / platformMax) * 100)}%` }} /></i>
                <em>{row.count}</em>
              </div>
            ))}
            {!data?.platforms.length ? <p className="ob-muted">No platform orders yet.</p> : null}
          </div>
        </article>
      </div>

      <div className="ob-dash-low">
        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3>Quick Actions</h3>
            <Link href="/orbit/orders">View all →</Link>
          </div>
          <div className="ob-quick-grid ob-quick-grid--3">
            <QuickAction href="/orbit/orders" label="Track orders" icon={<OrbitIcon name="orders" />} />
            <QuickAction href="/orbit/payments" label="Banker desk" icon={<OrbitIcon name="banker" />} />
            <QuickAction href="/orbit/customers" label="Customers" icon={<OrbitIcon name="customers" />} />
            <QuickAction href="/orbit/services" label="Services" icon={<OrbitIcon name="services" />} />
            <QuickAction href="/orbit/support" label="Tickets" icon={<OrbitIcon name="support" />} />
            <QuickAction href="/orbit/pages" label="Website" icon={<OrbitIcon name="pages" />} />
          </div>
        </article>
        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3>Recent Orders</h3>
            <Link href="/orbit/orders">View all →</Link>
          </div>
          <table className="ob-table">
            <thead><tr><th>Order</th><th>Service</th><th>Status</th><th>Amount</th></tr></thead>
            <tbody>
              {data?.recentOrders.length ? data.recentOrders.map((row) => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>{row.service}</td>
                  <td><StatusPill status={row.status} /></td>
                  <td>{usd(row.charge)}</td>
                </tr>
              )) : <tr><td colSpan={4}>No orders yet.</td></tr>}
            </tbody>
          </table>
        </article>
        <article className="ob-panel ob-card">
          <h3>Latest Activity</h3>
          <div className="ob-feed">
            {data?.recentTransactions.slice(0, 4).map((row) => (
              <div key={row.id} className="ob-feed-item"><span>{timeAgo(row.createdAt)}</span><div>{row.type} · {usd(row.amount)}</div></div>
            ))}
            {data?.recentTickets.slice(0, 3).map((row) => (
              <div key={row.id} className="ob-feed-item"><span>{timeAgo(row.updatedAt)}</span><div>Ticket · {row.subject}</div></div>
            ))}
            {!data?.recentTransactions.length && !data?.recentTickets.length ? <p className="ob-muted">No recent activity.</p> : null}
          </div>
        </article>
      </div>

      <article className="ob-panel ob-card" id="traffic">
        <div className="ob-panel-head">
          <div>
            <h3>Site traffic — where visitors came from</h3>
            <p className="ob-muted">Real visits from the live site. Direct, Google, social and referrals. Range: {ranges.find((row) => row.id === range)?.label}.</p>
          </div>
          <div>
            <strong>{traffic.data?.visits ?? 0}</strong> visits · <strong>{traffic.data?.unique ?? 0}</strong> unique
            {traffic.data?.change ? <span className="ob-muted"> · {traffic.data.change > 0 ? "+" : ""}{traffic.data.change}% vs prior</span> : null}
          </div>
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
            {!traffic.data?.sources.length ? <p className="ob-muted">No public visits recorded in this window yet. Open the live website to start collecting.</p> : null}
          </div>
          <table className="ob-table">
            <thead><tr><th>Top pages</th><th>Views</th></tr></thead>
            <tbody>
              {(traffic.data?.paths ?? []).map((row) => (
                <tr key={row.path}><td>{row.path}</td><td>{row.count}</td></tr>
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
    try {
      await send("/api/orbit/customers", { userId, direction, amount: Number(amount), reason, reference });
      setAmount("");
      setReason("");
      reload();
      setMessage("Wallet updated and written to the ledger.");
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
