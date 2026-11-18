"use client";

import { useState } from "react";
import { send, usd, useOrbit } from "@/components/orbit/use-orbit";
import { networkLabel } from "@/lib/nowpayments/network-labels";

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
  payAmount?: string | number | null;
  createdAt: string;
  paidAt?: string | null;
  provider?: string;
  providerStatus?: string | null;
  nowPaymentId?: string | null;
  network?: string | null;
  walletCredited?: boolean;
  actuallyPaidAmount?: string | null;
  verifiedFiatUsd?: string | null;
  overpaidCrypto?: string | null;
  reviewReason?: string | null;
  address?: string | null;
  reconciledAt?: string | null;
  reconciledBy?: string | null;
  reconcileResult?: string | null;
  reconcileProviderStatus?: string | null;
  reconcileHistory?: { at: string; adminId: string; providerStatus: string; result: string; reason?: string }[];
};

export function PaymentsScreen() {
  const { data, error, reload } = useOrbit<{ gateway: { live: boolean; currencies: string[] }; deposits: Deposit[] }>("/api/orbit/banker");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [adjustEmail, setAdjustEmail] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustConfirm, setAdjustConfirm] = useState(false);
  const [reconcileMessage, setReconcileMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const deposits = data?.deposits ?? [];
  const stats = {
    queue: deposits.filter((row) => row.status === "pending" || row.status === "confirming").length,
    paid: deposits.filter((row) => row.status === "paid").length,
    failed: deposits.filter((row) => row.status === "failed" || row.status === "expired").length,
    volume: deposits.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amountUsd, 0),
  };
  const currencies = [...new Set(deposits.map((row) => row.payCurrency || "").filter(Boolean))].sort();
  const networks = [...new Set(deposits.map((row) => row.network || "").filter(Boolean))].sort();
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detail, setDetail] = useState<Deposit | null>(null);
  const analytics = [
    { label: "Deposit applications", value: String(deposits.length) },
    { label: "Successful", value: String(stats.paid) },
    { label: "Pending", value: String(stats.queue) },
    { label: "Failed", value: String(deposits.filter((row) => row.status === "failed").length) },
    { label: "Expired", value: String(deposits.filter((row) => row.status === "expired").length) },
    { label: "Manual review", value: String(deposits.filter((row) => row.status === "review" || row.status === "partial").length) },
    { label: "Verified USD", value: usd(stats.volume) },
    { label: "Wallet credits", value: String(deposits.filter((row) => row.walletCredited).length) },
  ];
  const search = query.trim().toLowerCase();
  const rows = deposits.filter((row) => {
    const statusMatch =
      filter === "all" ||
      (filter === "pending" && (row.status === "pending" || row.status === "confirming")) ||
      (filter === "finished" && (row.status === "paid" || row.providerStatus === "finished")) ||
      (filter === "failed" && row.status === "failed") ||
      (filter === "expired" && row.status === "expired") ||
      (filter === "partial" && row.status === "partial") ||
      (filter === "review" && row.status === "review") ||
      (filter === "credited" && row.walletCredited) ||
      (filter === "not_credited" && !row.walletCredited);
    const haystack = `${row.id} ${row.nowPaymentId ?? ""} ${row.email} ${row.name ?? ""} ${row.txHash ?? ""}`.toLowerCase();
    const currencyMatch = !currencyFilter || row.payCurrency === currencyFilter;
    const networkMatch = !networkFilter || row.network === networkFilter;
    const created = row.createdAt.slice(0, 10);
    const dateMatch = (!fromDate || created >= fromDate) && (!toDate || created <= toDate);
    return statusMatch && currencyMatch && networkMatch && dateMatch && (!search || haystack.includes(search));
  });

  async function act(invoiceId: string, action: "expire" | "fail") {
    setBusy(`${invoiceId}:${action}`);
    setMessage("");
    const response = await fetch("/api/orbit/banker", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoiceId, action }),
    });
    const payload = await response.json();
    setBusy("");
    setMessage(response.ok ? `Deposit marked ${action}.` : payload.error || "Action failed");
    reload();
  }

  /**
   * Ask the server to re-read this deposit's status from NOWPayments.
   * The browser only supplies the deposit id; the provider call, verification and any credit
   * happen server-side. A refresh can never mark a deposit paid by itself.
   */
  async function reconcile(invoiceId: string) {
    setBusy(`${invoiceId}:reconcile`);
    setReconcileMessage(null);
    try {
      const response = await fetch("/api/orbit/banker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceId, action: "reconcile" }),
      });
      const payload = (await response.json()) as { message?: string; error?: string; outcome?: string };
      setReconcileMessage({ tone: response.ok ? "ok" : "bad", text: payload.message || payload.error || "Refresh failed." });
    } catch {
      setReconcileMessage({ tone: "bad", text: "Could not reach the server. Nothing was changed." });
    } finally {
      setBusy("");
      reload();
    }
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
          {analytics.slice(0, 4).map((row) => (
            <div className="ob-banker-stat" key={row.label}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="ob-stats-grid">
        {analytics.slice(4).map((row) => (
          <div className="ob-stat-card" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
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
          ["finished", "Finished"],
          ["failed", "Failed"],
          ["expired", "Expired"],
          ["partial", "Partially paid"],
          ["review", "Manual review"],
          ["credited", "Credited"],
          ["not_credited", "Not credited"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={`ob-btn ghost${filter === id ? " is-on" : ""}`} onClick={() => setFilter(id)}>{label}</button>
        ))}
        <input placeholder="Search deposit, payment ID, email, hash" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={currencyFilter} onChange={(event) => setCurrencyFilter(event.target.value)} aria-label="Currency">
          <option value="">All currencies</option>
          {currencies.map((code) => (
            <option key={code} value={code}>
              {code?.toUpperCase()}
            </option>
          ))}
        </select>
        <select value={networkFilter} onChange={(event) => setNetworkFilter(event.target.value)} aria-label="Network">
          <option value="">All networks</option>
          {networks.map((net) => (
            <option key={net} value={net}>
              {net}
            </option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="From date" />
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="To date" />
      </div>

      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      {reconcileMessage ? (
        <p
          className={reconcileMessage.tone === "ok" ? "ob-reconcile-note ob-reconcile-note--ok" : "ob-error"}
          role="status"
          aria-live="polite"
        >
          {reconcileMessage.text}
        </p>
      ) : null}

      <div className="ob-table-wrap ob-card" style={{ padding: 0 }}>
        <table className="ob-table">
          <thead>
            <tr>
              <th>Deposit</th>
              <th>NOWPayments ID</th>
              <th>Customer</th>
              <th>Requested USD</th>
              <th>Paid crypto</th>
              <th>Coin</th>
              <th>Network</th>
              <th>Provider status</th>
              <th>Credited</th>
              <th>Verified USD</th>
              <th>Mismatch</th>
              <th>Hash</th>
              <th>Created</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.nowPaymentId || "—"}</td>
                <td>
                  <strong>{row.email}</strong>
                  {row.name ? <div className="ob-muted">{row.name}</div> : null}
                </td>
                <td>{usd(row.amountUsd)}</td>
                <td>{row.actuallyPaidAmount || row.payAmount || "—"}</td>
                <td>{row.payCurrency || "—"}</td>
                <td>{row.network || "—"}</td>
                <td><StatusPill status={row.providerStatus || row.status} /></td>
                <td>{row.walletCredited ? "Yes" : "No"}</td>
                <td>{row.verifiedFiatUsd || "—"}</td>
                <td>{row.reviewReason || (row.overpaidCrypto ? `Overpaid ${row.overpaidCrypto}` : "—")}</td>
                <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>{row.txHash || "—"}</td>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>{row.paidAt ? new Date(row.paidAt).toLocaleString() : "—"}</td>
                <td>
                  <div className="ob-toolbar">
                    <button className="ob-btn" type="button" onClick={() => setDetail(row)}>
                      Details
                    </button>
                    {row.provider === "nowpayments" && row.nowPaymentId && !row.walletCredited ? (
                      <button
                        className="ob-btn"
                        type="button"
                        disabled={busy === `${row.id}:reconcile`}
                        title="Re-read this deposit's status from NOWPayments (server-side)"
                        onClick={() => void reconcile(row.id)}
                      >
                        {busy === `${row.id}:reconcile` ? "Checking…" : "Refresh"}
                      </button>
                    ) : null}
                    {row.status === "paid" ? null : (
                      <>
                        <button className="ob-btn" type="button" disabled={busy === `${row.id}:expire`} onClick={() => act(row.id, "expire")}>Expire</button>
                        <button className="ob-btn warn" type="button" disabled={busy === `${row.id}:fail`} onClick={() => act(row.id, "fail")}>Fail</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={15}>No deposits in this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        className="ob-form ob-card"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage("");
          const response = await fetch("/api/orbit/banker", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              action: "adjust",
              email: adjustEmail,
              amountUsd: adjustAmount,
              reason: adjustReason,
              confirm: adjustConfirm,
              idempotencyKey: `adj${Date.now().toString(36)}`,
            }),
          });
          const payload = await response.json();
          setMessage(
            response.ok
              ? "Manual ledger adjustment recorded. This is not a NOWPayments payment."
              : payload.error || "Adjustment failed",
          );
          if (response.ok) {
            setAdjustAmount("");
            setAdjustReason("");
            setAdjustConfirm(false);
            reload();
          }
        }}
      >
        <h3>Manual balance adjustment</h3>
        <p className="ob-muted">Separate from NOWPayments deposits. A reason and confirmation are required. This does not mark a payment finished.</p>
        <label>Customer email<input value={adjustEmail} onChange={(event) => setAdjustEmail(event.target.value)} required /></label>
        <label>USD amount<input value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} inputMode="decimal" required /></label>
        <label>Reason<textarea value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} required minLength={8} /></label>
        <label>
          <input type="checkbox" checked={adjustConfirm} onChange={(event) => setAdjustConfirm(event.target.checked)} />
          I confirm this is a manual ledger adjustment, not a NOWPayments completion.
        </label>
        <button className="ob-btn primary" type="submit" disabled={!adjustConfirm}>Record adjustment</button>
      </form>

      {detail ? (
        <div className="ob-drawer-backdrop" role="dialog" aria-modal="true" aria-labelledby="ob-deposit-detail">
          <div className="ob-drawer">
            <header className="ob-drawer-head">
              <div>
                <p className="ob-muted">{detail.provider === "nowpayments" ? "NOWPayments deposit" : "Demo deposit"}</p>
                <h3 id="ob-deposit-detail">{detail.id}</h3>
              </div>
              <button className="ob-btn" type="button" onClick={() => setDetail(null)}>
                Close
              </button>
            </header>

            {detail.status === "review" || detail.status === "partial" ? (
              <p className="ob-note ob-note--warn">
                Manual review required{detail.reviewReason ? `: ${detail.reviewReason.replace(/_/g, " ")}` : ""}. No wallet credit was applied.
              </p>
            ) : null}

            <dl className="ob-detail-list">
              <div><dt>Customer</dt><dd>{detail.name || "—"}</dd></div>
              <div><dt>Email</dt><dd>{detail.email}</dd></div>
              <div><dt>Deposit ID</dt><dd>{detail.id}</dd></div>
              <div><dt>NOWPayments ID</dt><dd>{detail.nowPaymentId || "—"}</dd></div>
              <div><dt>Requested USD</dt><dd>{usd(detail.amountUsd)}</dd></div>
              <div><dt>Crypto currency</dt><dd>{detail.payCurrency?.toUpperCase() || "—"}</dd></div>
              <div><dt>Network</dt><dd>{detail.network ? networkLabel(detail.network) : "—"}</dd></div>
              <div><dt>Expected crypto</dt><dd>{detail.payAmount || "—"}</dd></div>
              <div><dt>Actually paid</dt><dd>{detail.actuallyPaidAmount || "—"}</dd></div>
              <div><dt>Provider status</dt><dd>{detail.providerStatus || detail.status}</dd></div>
              <div><dt>Verified USD</dt><dd>{detail.verifiedFiatUsd || "—"}</dd></div>
              <div><dt>Wallet credited</dt><dd>{detail.walletCredited ? "Yes" : "No"}</dd></div>
              <div><dt>Ledger reference</dt><dd>{detail.walletCredited ? detail.id : "—"}</dd></div>
              <div><dt>Mismatch reason</dt><dd>{detail.reviewReason || (detail.overpaidCrypto ? `Overpaid ${detail.overpaidCrypto}` : "—")}</dd></div>
              <div><dt>Deposit address</dt><dd><code>{detail.address || "—"}</code></dd></div>
              <div><dt>Transaction hash</dt><dd>{detail.txHash || "—"}</dd></div>
              <div><dt>Created</dt><dd>{new Date(detail.createdAt).toLocaleString()}</dd></div>
              <div><dt>Completed</dt><dd>{detail.paidAt ? new Date(detail.paidAt).toLocaleString() : "—"}</dd></div>
              <div><dt>Last reconciled</dt><dd>{detail.reconciledAt ? `${new Date(detail.reconciledAt).toLocaleString()} · ${detail.reconcileResult ?? "—"}` : "Never"}</dd></div>
            </dl>

            {detail.reconcileHistory?.length ? (
              <section className="ob-reconcile-log">
                <h4>Reconciliation audit</h4>
                <ul>
                  {[...detail.reconcileHistory].reverse().map((entry, index) => (
                    <li key={`${entry.at}-${index}`}>
                      <span>{new Date(entry.at).toLocaleString()}</span>
                      <strong>{entry.result.replace(/_/g, " ")}</strong>
                      <em>
                        {entry.providerStatus}
                        {entry.reason ? ` · ${entry.reason.replace(/_/g, " ")}` : ""} · {entry.adminId}
                      </em>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="ob-muted">
              IPN signature is verified before this record can be marked paid. A manual adjustment never marks a NOWPayments
              payment as finished.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase();
  const tone =
    key === "paid" || key === "connected"
      ? "good"
      : key === "pending" || key === "confirming" || key === "review" || key === "partial"
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
