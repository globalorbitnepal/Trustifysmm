"use client";

import { useState } from "react";
import { send, usd, useOrbit } from "@/components/orbit/use-orbit";

type Detail = {
  customer: { id: string; email: string; name: string | null; username?: string | null; balance: number; suspended: boolean; apiKeyRevoked: boolean; createdAt: string; apiKeyMasked: string; google?: boolean; totpEnabled?: boolean; totpActivatedAt?: string | null };
  orders: { id: number; service: string; link: string; quantity: number; charge: number; status: string; channel?: string; createdAt: string }[];
  api?: { id: string; at: string; action: string; ok: boolean; detail: string; ip: string; orderId: number | null; keyPrefix: string }[];
  ledger: { id: string; type: string; amount: number; description: string; createdAt: string }[];
  logins: { createdAt: string; method: string; ip: string }[];
  tickets: { id: string; subject: string; status: string }[];
};

/** Small labelled figure used across the customer header and KPI strip. */
function DetailStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="ob-cust-stat">
      <span>{label}</span>
      <strong className={tone ? `is-${tone}` : undefined}>{value}</strong>
    </div>
  );
}

function statusTone(status: string): "good" | "warn" | "bad" | undefined {
  const value = status.toLowerCase();
  if (["completed", "paid", "deposit"].includes(value)) return "good";
  if (["pending", "processing", "in progress", "confirming"].includes(value)) return "warn";
  if (["canceled", "cancelled", "refunded", "failed"].includes(value)) return "bad";
  return undefined;
}

export function CustomerDetailScreen({ id }: { id: string }) {
  const { data, error, reload } = useOrbit<Detail>(`/api/orbit/customers/${id}`);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [balance, setBalance] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [tab, setTab] = useState<"orders" | "wallet" | "activity" | "logins">("orders");
  const [message, setMessage] = useState("");
  const customer = data?.customer;
  async function patch(body: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/orbit/customers", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: id, ...body }) });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Update failed");
      return;
    }
    reload();
    setMessage("Saved.");
  }
  if (error) return <p className="ob-error">{error}</p>;
  if (!customer) return <p className="ob-muted">Loading customer…</p>;

  const orders = data?.orders ?? [];
  const ledger = data?.ledger ?? [];
  const logins = data?.logins ?? [];
  const spend = orders.reduce((sum, order) => sum + (order.status === "Refunded" ? 0 : order.charge), 0);
  const deposits = ledger.filter((row) => row.type === "deposit").reduce((sum, row) => sum + row.amount, 0);
  const lastLogin = logins[0];
  const lastIp = lastLogin?.ip || "—";
  const signupMethod = customer.google ? "Google" : "Email & password";

  return (
    <>
      <article className="ob-card ob-cust-head">
        <div className="ob-cust-identity">
          <div className="ob-cust-avatar" aria-hidden>
            {(customer.name || customer.email).charAt(0).toUpperCase()}
          </div>
          <div className="ob-cust-id-copy">
            <h2 style={{ margin: 0 }}>{customer.name || customer.email.split("@")[0]}</h2>
            <p className="ob-muted" style={{ margin: "2px 0 0" }}>{customer.email}</p>
            <div className="ob-cust-tags">
              <span className={`ob-cust-tag ${customer.suspended ? "is-bad" : "is-good"}`}>
                {customer.suspended ? "Suspended" : "Active"}
              </span>
              <span className="ob-cust-tag">{signupMethod}</span>
              {customer.totpEnabled ? <span className="ob-cust-tag is-good">2FA on</span> : <span className="ob-cust-tag">2FA off</span>}
              {customer.apiKeyRevoked ? <span className="ob-cust-tag is-bad">API revoked</span> : null}
            </div>
          </div>
        </div>
        <div className="ob-cust-kpis">
          <DetailStat label="Wallet balance" value={usd(customer.balance)} />
          <DetailStat label="Total spent" value={usd(spend)} />
          <DetailStat label="Deposits" value={usd(deposits)} tone="good" />
          <DetailStat label="Orders" value={String(orders.length)} />
          <DetailStat label="Joined" value={customer.createdAt.slice(0, 10)} />
          <DetailStat label="Last IP" value={lastIp} />
        </div>
      </article>

      <div className="ob-cust-actions">
        <article className="ob-card ob-form">
          <h3 style={{ marginTop: 0 }}>Wallet adjustment</h3>
          <p className="ob-muted" style={{ marginTop: 0 }}>
            Every change writes a ledger entry. Current balance {usd(customer.balance)}.
          </p>
          <div className="ob-toolbar">
            <button type="button" className={direction === "credit" ? "ob-btn primary" : "ob-btn"} onClick={() => setDirection("credit")}>Credit</button>
            <button type="button" className={direction === "debit" ? "ob-btn primary" : "ob-btn"} onClick={() => setDirection("debit")}>Debit</button>
          </div>
          <label>Amount (USD)<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="25.00" /></label>
          <label>Reason (required)<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Goodwill credit, manual top-up…" /></label>
          <button
            className="ob-btn primary"
            type="button"
            onClick={() => {
              patch({ direction, amount: Number(amount), reason });
              setAmount("");
            }}
          >
            {direction === "credit" ? "Add funds" : "Deduct funds"}
          </button>
        </article>

        <article className="ob-card ob-form">
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <label>Display name<input value={name} placeholder={customer.name || ""} onChange={(event) => setName(event.target.value)} /></label>
          <button className="ob-btn" type="button" onClick={() => patch({ name })}>Save name</button>
          <label>Set exact balance<input value={balance} onChange={(event) => setBalance(event.target.value)} placeholder={String(customer.balance)} /></label>
          <button className="ob-btn" type="button" onClick={() => patch({ balance: Number(balance), reason: reason || "Balance set by admin" })}>Set balance</button>
          <div className="ob-toolbar">
            <button className="ob-btn" type="button" onClick={() => patch({ suspended: !customer.suspended })}>{customer.suspended ? "Restore account" : "Suspend account"}</button>
            <button className="ob-btn" type="button" onClick={() => patch({ revoked: !customer.apiKeyRevoked })}>{customer.apiKeyRevoked ? "Restore API" : "Revoke API"}</button>
            <button className="ob-btn" type="button" onClick={() => patch({ clearTotp: true, reason: reason || "Authenticator reset requested" })}>Clear 2FA</button>
          </div>
          <p className="ob-muted" style={{ marginBottom: 0 }}>API key {customer.apiKeyMasked}</p>
        </article>
      </div>

      {message ? <p className="ob-reconcile-note ob-reconcile-note--ok">{message}</p> : null}

      <div className="ob-chart-tabs">
        <button type="button" className={tab === "orders" ? "is-on" : ""} onClick={() => setTab("orders")}>Orders ({orders.length})</button>
        <button type="button" className={tab === "wallet" ? "is-on" : ""} onClick={() => setTab("wallet")}>Wallet ledger ({ledger.length})</button>
        <button type="button" className={tab === "activity" ? "is-on" : ""} onClick={() => setTab("activity")}>API &amp; tickets ({(data?.api ?? []).length})</button>
        <button type="button" className={tab === "logins" ? "is-on" : ""} onClick={() => setTab("logins")}>Logins ({logins.length})</button>
      </div>

      {tab === "orders" ? (
        <div className="ob-table-wrap">
          <table className="ob-table">
            <thead><tr><th>Order</th><th>From</th><th>Service</th><th>Qty</th><th>Charge</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.length ? orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order"><strong>#TS-{order.id}</strong></td>
                  <td data-label="From">{order.channel === "api" ? "API" : "Dashboard"}</td>
                  <td data-label="Service" className="ob-ellipsis">{order.service}</td>
                  <td data-label="Qty">{order.quantity.toLocaleString()}</td>
                  <td data-label="Charge">{usd(order.charge)}</td>
                  <td data-label="Status"><span className={`ob-cust-tag is-${statusTone(order.status) ?? "muted"}`}>{order.status}</span></td>
                  <td data-label="Date" className="ob-muted">{order.createdAt.slice(0, 16).replace("T", " ")}</td>
                </tr>
              )) : <tr><td colSpan={7} className="ob-muted">No orders from this customer yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "wallet" ? (
        <div className="ob-table-wrap">
          <table className="ob-table">
            <thead><tr><th>When</th><th>Type</th><th>Amount</th><th>Detail</th></tr></thead>
            <tbody>
              {ledger.length ? ledger.map((row) => (
                <tr key={row.id}>
                  <td data-label="When" className="ob-muted">{row.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td data-label="Type"><span className={`ob-cust-tag is-${statusTone(row.type) ?? "muted"}`}>{row.type}</span></td>
                  <td data-label="Amount"><strong>{usd(row.amount)}</strong></td>
                  <td data-label="Detail">{row.description}</td>
                </tr>
              )) : <tr><td colSpan={4} className="ob-muted">No wallet movements recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "activity" ? (
        <>
          <div className="ob-table-wrap">
            <table className="ob-table">
              <thead><tr><th>When</th><th>Action</th><th>Result</th><th>IP</th><th>Detail</th></tr></thead>
              <tbody>
                {(data?.api ?? []).length ? (data?.api ?? []).map((row) => (
                  <tr key={row.id}>
                    <td data-label="When" className="ob-muted">{row.at.slice(0, 16).replace("T", " ")}</td>
                    <td data-label="Action">{row.action}</td>
                    <td data-label="Result"><span className={`ob-cust-tag is-${row.ok ? "good" : "bad"}`}>{row.ok ? "OK" : "Failed"}</span></td>
                    <td data-label="IP"><code className="ob-url">{row.ip}</code></td>
                    <td data-label="Detail">{row.detail}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="ob-muted">This customer has not called the API yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <article className="ob-card">
            <h3 style={{ marginTop: 0 }}>Support tickets</h3>
            {(data?.tickets ?? []).length ? (data?.tickets ?? []).map((ticket) => (
              <p key={ticket.id} style={{ margin: "4px 0" }}>
                <strong>{ticket.subject}</strong> · <span className="ob-muted">{ticket.status}</span>
              </p>
            )) : <p className="ob-muted">No tickets from this customer.</p>}
          </article>
        </>
      ) : null}

      {tab === "logins" ? (
        <div className="ob-table-wrap">
          <table className="ob-table">
            <thead><tr><th>When</th><th>Method</th><th>IP address</th></tr></thead>
            <tbody>
              {logins.length ? logins.map((row, index) => (
                <tr key={`${row.createdAt}-${index}`}>
                  <td data-label="When" className="ob-muted">{row.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td data-label="Method">{row.method === "google" ? "Google" : "Password"}</td>
                  <td data-label="IP address"><code className="ob-url">{row.ip}</code></td>
                </tr>
              )) : <tr><td colSpan={3} className="ob-muted">No sign-ins recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

type ServiceRow = { id: number; name: string; platform: string; group: string; rate: number; editRate: number; cost: number | null; margin: number | null; custom: boolean };
type ServicesPayload = { items: ServiceRow[]; total: number; page: number; pages: number; globalMarkupPercent: number; categories: { id: string; name: string; platform: string; active: boolean; services: number }[]; platforms: { id: string; label: string }[] };

export function ServicesScreen() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, reload } = useOrbit<ServicesPayload>(`/api/orbit/services?q=${encodeURIComponent(q)}&page=${page}`);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [markup, setMarkup] = useState("");
  const [bulk, setBulk] = useState({ percent: "", platform: "", group: "" });
  const [created, setCreated] = useState({ name: "", platform: "instagram", group: "", ratePer1000: "", costPer1000: "", minOrder: "10", maxOrder: "100000" });
  async function act(body: Record<string, unknown>) {
    setMessage("");
    try {
      const result = await send("/api/orbit/services", body);
      if (result.count !== undefined) setMessage(`Updated ${result.count} services.`);
      reload();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Save failed");
    }
  }
  return (
    <>
      <p className="ob-muted">{data ? `${data.total} live services` : "Loading services…"} · Global markup {data?.globalMarkupPercent ?? 0}% is applied on top of the saved price. Customer pages read the saved price immediately.</p>
      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p>{message}</p> : null}
      <form className="ob-form" onSubmit={(event) => { event.preventDefault(); act({ action: "create", ...created, ratePer1000: Number(created.ratePer1000), costPer1000: created.costPer1000 ? Number(created.costPer1000) : undefined }); }}>
        <label>New service<input value={created.name} onChange={(event) => setCreated({ ...created, name: event.target.value })} required /></label>
        <label>Platform<input value={created.platform} onChange={(event) => setCreated({ ...created, platform: event.target.value })} /></label>
        <label>Category<input value={created.group} onChange={(event) => setCreated({ ...created, group: event.target.value })} required /></label>
        <label>Sell / 1K<input value={created.ratePer1000} onChange={(event) => setCreated({ ...created, ratePer1000: event.target.value })} required /></label>
        <label>Cost / 1K<input value={created.costPer1000} onChange={(event) => setCreated({ ...created, costPer1000: event.target.value })} /></label>
        <button className="ob-btn primary" type="submit">Create</button>
      </form>
      <div className="ob-toolbar">
        <input placeholder="Search" value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} />
        <input placeholder="Markup %" value={markup} onChange={(event) => setMarkup(event.target.value)} />
        <button className="ob-btn" type="button" onClick={() => act({ action: "markup", percent: Number(markup) })}>Save markup</button>
        <input placeholder="Bulk %" value={bulk.percent} onChange={(event) => setBulk({ ...bulk, percent: event.target.value })} />
        <input placeholder="Platform filter" value={bulk.platform} onChange={(event) => setBulk({ ...bulk, platform: event.target.value })} />
        <input placeholder="Category filter" value={bulk.group} onChange={(event) => setBulk({ ...bulk, group: event.target.value })} />
        <button className="ob-btn" type="button" onClick={() => act({ action: "bulk", percent: Number(bulk.percent), platform: bulk.platform, group: bulk.group })}>Apply bulk %</button>
      </div>
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>ID</th><th>Service</th><th>Category</th><th>Customer /1K</th><th>Saved price</th><th>Cost</th><th>Margin</th><th></th></tr></thead>
          <tbody>
            {data?.items.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.platform} · {row.group}</td>
                <td>{usd(row.rate)}</td>
                <td><input value={drafts[row.id] ?? String(row.editRate)} onChange={(event) => setDrafts({ ...drafts, [row.id]: event.target.value })} /></td>
                <td>{row.cost === null ? "—" : usd(row.cost)}</td>
                <td>{row.margin === null ? "—" : usd(row.margin)}</td>
                <td>
                  <button className="ob-btn" type="button" onClick={() => act({ action: "update", id: row.id, ratePer1000: Number(drafts[row.id] ?? row.editRate) })}>Save</button>
                  <button className="ob-btn" type="button" onClick={() => act({ action: "duplicate", id: row.id })}>Copy</button>
                  <button className="ob-btn warn" type="button" onClick={() => act({ action: "hide", id: row.id })}>{row.custom ? "Delete" : "Hide"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ob-toolbar">
        <button className="ob-btn" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span>Page {page} / {data?.pages || 1}</span>
        <button className="ob-btn" type="button" disabled={!data || page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>Category</th><th>Platform</th><th>Services</th><th>Visible</th></tr></thead>
          <tbody>
            {data?.categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.platform}</td>
                <td>{category.services}</td>
                <td><button className="ob-btn" type="button" onClick={() => act({ action: "category", id: category.id, name: category.name, platform: category.platform, active: !category.active })}>{category.active ? "Hide" : "Show"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
