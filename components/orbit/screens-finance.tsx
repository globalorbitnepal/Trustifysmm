"use client";

import { useState } from "react";
import { send, usd, useOrbit } from "@/components/orbit/use-orbit";

type OrderRow = { id: number; customer: string; service: string; platform: string; link: string; quantity: number; charge: number; cost: number | null; margin: number | null; status: string; createdAt: string };

export function OrdersScreen() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const { data, error, reload } = useOrbit<{ orders: OrderRow[]; total: number }>(`/api/orbit/orders?q=${encodeURIComponent(q)}&status=${status}`);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  return (
    <>
      <div className="ob-toolbar">
        <input placeholder="Search order, customer, link" value={q} onChange={(event) => setQ(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {["Pending", "Processing", "In progress", "Completed", "Partial", "Canceled", "Refunded"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input placeholder="Refund reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>
      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      <p className="ob-muted">{data ? `${data.total} orders` : "Loading orders…"} · Wholesale cost appears only when the service has a saved cost.</p>
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>ID</th><th>Customer</th><th>Service</th><th>Link</th><th>Qty</th><th>Charge</th><th>Margin</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data?.orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.service}</td>
                <td>{order.link}</td>
                <td>{order.quantity}</td>
                <td>{usd(order.charge)}</td>
                <td>{order.margin === null ? "—" : usd(order.margin)}</td>
                <td>{order.status}</td>
                <td>{order.status === "Refunded" ? null : <button className="ob-btn" type="button" onClick={async () => {
                  try {
                    await send("/api/orbit/orders", { orderId: order.id, reason });
                    setMessage(`Refunded #${order.id}`);
                    reload();
                  } catch (reasonError) {
                    setMessage(reasonError instanceof Error ? reasonError.message : "Refund failed");
                  }
                }}>Refund</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

type Deposit = {
  id: string;
  email: string;
  name: string | null;
  amountUsd: number;
  status: string;
  txHash: string | null;
  payCurrency: string | null;
  payAmount?: number | null;
  createdAt: string;
  paidAt?: string | null;
  provider?: string;
};

export function PaymentsScreen() {
  const { data, error, reload } = useOrbit<{ gateway: { live: boolean; currencies: string[] }; deposits: Deposit[] }>("/api/orbit/banker");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const deposits = data?.deposits ?? [];
  const stats = {
    queue: deposits.filter((row) => row.status === "pending" || row.status === "confirming").length,
    paid: deposits.filter((row) => row.status === "paid").length,
    failed: deposits.filter((row) => row.status === "failed" || row.status === "expired").length,
    volume: deposits.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amountUsd, 0),
  };
  const search = query.trim().toLowerCase();
  const rows = deposits.filter((row) => (filter === "all" ? true : row.status === filter) && (!search || `${row.id} ${row.email} ${row.name ?? ""} ${row.txHash ?? ""}`.toLowerCase().includes(search)));

  async function act(invoiceId: string, action: "credit" | "expire" | "fail") {
    setBusy(`${invoiceId}:${action}`);
    setMessage("");
    const response = await fetch("/api/orbit/banker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoiceId, action }),
    });
    const payload = await response.json();
    setBusy("");
    setMessage(response.ok ? (action === "credit" ? "Deposit credited to the customer wallet." : `Deposit marked ${action}.`) : payload.error || "Action failed");
    reload();
  }

  return (
    <>
      <section className="ob-banker-hero">
        <div>
          <span className="ob-hero-tag">Finance · Banker</span>
          <h2>Crypto deposit command center</h2>
          <p>Verify gateway confirmation, credit customer wallets, and keep a full audit trail.</p>
          <div className="ob-hero-meta">
            <span className="ob-hero-pill">{data?.gateway.live ? "● Gateway live" : "● Gateway not configured"}</span>
            <span className="ob-hero-pill">{data?.gateway.currencies.length ? data.gateway.currencies.join(" · ") : "No coins enabled"}</span>
          </div>
        </div>
        <div className="ob-banker-stats">
          <div className="ob-banker-stat"><span>Review queue</span><strong>{stats.queue}</strong></div>
          <div className="ob-banker-stat"><span>Paid deposits</span><strong>{stats.paid}</strong></div>
          <div className="ob-banker-stat"><span>Failed / expired</span><strong>{stats.failed}</strong></div>
          <div className="ob-banker-stat"><span>Paid volume</span><strong>{usd(stats.volume)}</strong></div>
        </div>
      </section>

      <div className="ob-split">
        <article className="ob-panel ob-card">
          <div className="ob-panel-head">
            <h3>Gateway status</h3>
            <StatusPill status={data?.gateway.live ? "Connected" : "Not configured"} />
          </div>
          <p className="ob-muted">
            {data?.gateway.live
              ? `Enabled coins: ${data.gateway.currencies.join(", ")}`
              : "NOWPayments API and IPN secrets are not set in the server environment. The customer panel shows deposits as unavailable."}
          </p>
          <p className="ob-muted">Credentials stay on the server only. Orbit never exposes live gateway secrets.</p>
        </article>
        <article className="ob-panel ob-card">
          <h3>Verification rules</h3>
          <ul className="ob-health">
            <li><i /> Hash submission moves a deposit to confirming</li>
            <li><i /> Webhook signature credits once when verified</li>
            <li><i /> Manual credit is for verified transfers only</li>
            <li><i style={{ background: "var(--warn)" }} /> Never credit from screenshots alone</li>
          </ul>
        </article>
      </div>

      <div className="ob-filter-row">
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["confirming", "Confirming"],
          ["paid", "Paid"],
          ["failed", "Failed"],
          ["expired", "Expired"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={`ob-btn ghost${filter === id ? " is-on" : ""}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
        <input placeholder="Search deposit, email, hash" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <div className="ob-table-wrap ob-card" style={{ padding: 0 }}>
        <table className="ob-table">
          <thead>
            <tr>
              <th>Deposit</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Coin</th>
              <th>Status</th>
              <th>Hash</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  <strong>{row.email}</strong>
                  {row.name ? <div className="ob-muted">{row.name}</div> : null}
                </td>
                <td>{usd(row.amountUsd)}</td>
                <td>{row.payCurrency || "—"}</td>
                <td><StatusPill status={row.status} /></td>
                <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{row.txHash || "—"}</td>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>
                  <div className="ob-toolbar">
                    {row.status === "paid" ? <span className="ob-muted">Settled</span> : (
                      <>
                        <button className="ob-btn primary" type="button" disabled={busy === `${row.id}:credit`} onClick={() => act(row.id, "credit")}>{busy === `${row.id}:credit` ? "Crediting…" : "Credit"}</button>
                        <button className="ob-btn" type="button" disabled={busy === `${row.id}:expire`} onClick={() => act(row.id, "expire")}>Expire</button>
                        <button className="ob-btn warn" type="button" disabled={busy === `${row.id}:fail`} onClick={() => act(row.id, "fail")}>Fail</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8}>No deposits in this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const tone =
    key === "paid" || key === "connected"
      ? "good"
      : key === "pending" || key === "confirming"
        ? "warn"
        : key === "failed" || key === "expired" || key === "not configured"
          ? "bad"
          : "muted";
  return <span className={`ob-pill-tone ob-pill-tone--${tone}`}>{status}</span>;
}

export function TransactionsScreen() {
  const { data, error } = useOrbit<{ transactions: { id: string; customer: string; type: string; amount: number; description: string; createdAt: string }[] }>("/api/orbit/ledger");
  if (error) return <p className="ob-error">{error}</p>;
  return (
    <div className="ob-table-wrap">
      <table className="ob-table">
        <thead><tr><th>When</th><th>Customer</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead>
        <tbody>
          {data?.transactions.map((row) => <tr key={row.id}><td>{row.createdAt.slice(0, 16).replace("T", " ")}</td><td>{row.customer}</td><td>{row.type}</td><td>{usd(row.amount)}</td><td>{row.description}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function ProvidersScreen() {
  const { data, error, reload } = useOrbit<{ providers: { id: string; name: string; endpoint: string; enabled: boolean; keyMasked: string; lastStatus: string }[] }>("/api/orbit/providers");
  const [form, setForm] = useState({ name: "", endpoint: "", apiKey: "" });
  const [message, setMessage] = useState("");
  return (
    <>
      <p className="ob-note">API keys stay on the server. The panel only shows a masked key. Saving a provider does not import or republish its prices.</p>
      <form className="ob-form" onSubmit={async (event) => {
        event.preventDefault();
        try {
          await send("/api/orbit/providers", form);
          setForm({ name: "", endpoint: "", apiKey: "" });
          reload();
        } catch (reason) {
          setMessage(reason instanceof Error ? reason.message : "Save failed");
        }
      }}>
        <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Endpoint<input value={form.endpoint} onChange={(event) => setForm({ ...form, endpoint: event.target.value })} required /></label>
        <label>API key<input value={form.apiKey} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} /></label>
        <button className="ob-btn primary" type="submit">Save provider</button>
      </form>
      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {data?.providers.map((provider) => (
        <article key={provider.id} className="ob-card">
          <b>{provider.name}</b>
          <p>{provider.endpoint}</p>
          <p>{provider.enabled ? provider.lastStatus : "Disabled"} · {provider.keyMasked || "No key"}</p>
          <button className="ob-btn" type="button" onClick={async () => {
            try {
              const result = await send("/api/orbit/providers", { action: "test", id: provider.id });
              setMessage(`${provider.name}: ${result.status}`);
              reload();
            } catch (reason) {
              setMessage(reason instanceof Error ? reason.message : "Test failed");
            }
          }}>Test connection</button>
        </article>
      ))}
    </>
  );
}
