"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Empty, Skeleton } from "@/components/dashboard/OverviewView";

type Service = {
  id: number;
  name: string;
  platform: string;
  platformLabel: string;
  group: string;
  description: string;
  ratePer1000: number;
  min: number;
  max: number;
  avgTime: string;
  status: string;
};

type Catalog = { platforms: { id: string; label: string }[]; groups: string[]; services: Service[]; favoriteIds: number[] };

export function NewOrderView() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [platform, setPlatform] = useState("");
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");
  const [service, setService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [balance, setBalance] = useState(0);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ id: number; charge: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (group) params.set("group", group);
    if (q) params.set("q", q);
    const handle = setTimeout(() => {
      void fetch(`/api/dashboard/catalog?${params}`).then(async (res) => {
        if (res.ok) setCatalog((await res.json()) as Catalog);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [platform, group, q]);

  useEffect(() => {
    void fetch("/api/dashboard/session").then(async (res) => {
      if (res.ok) {
        const data = (await res.json()) as { user: { balance: number } };
        setBalance(data.user.balance);
      }
    });
  }, []);

  const quantity = Number(qty);
  const charge = service && Number.isFinite(quantity) ? (service.ratePer1000 * quantity) / 1000 : 0;

  async function place() {
    if (!service) return;
    setBusy(true);
    setError("");
    const idempotencyKey = crypto.randomUUID();
    const res = await fetch("/api/dashboard/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idempotencyKey, rows: [{ serviceId: service.id, link, quantity }] }),
    });
    const data = (await res.json()) as { error?: string; orders?: { id: number; charge: number }[]; balance?: number };
    setBusy(false);
    if (!res.ok || !data.orders?.[0]) {
      setError(data.error || "Order was not placed.");
      return;
    }
    setPlaced(data.orders[0]);
    if (typeof data.balance === "number") setBalance(data.balance);
  }

  if (placed && service) {
    return (
      <section className="cp-card">
        <p className="cp-ok">Order placed</p>
        <h2>Order #{placed.id}</h2>
        <p>{service.platformLabel} · {service.name}</p>
        <p>Target: {link}</p>
        <p>Quantity: {quantity}</p>
        <p>Charge: ${placed.charge.toFixed(4)}</p>
        <Link className="cp-btn" href={`/dashboard/orders/${placed.id}`}>Track order</Link>
      </section>
    );
  }

  return (
    <div className="cp-grid cp-split">
      <section className="cp-card">
        <div className="cp-steps">
          {["Platform", "Category", "Service", "Details", "Confirm"].map((label, i) => (
            <span key={label} className={step === i + 1 ? "is-on" : ""}>{i + 1}. {label}</span>
          ))}
        </div>
        {error ? <p className="cp-error">{error}</p> : null}
        {!catalog ? <Skeleton /> : (
          <>
            <div className="cp-platforms">
              {catalog.platforms.map((item) => (
                <button key={item.id} type="button" className={`cp-chip ${platform === item.id ? "is-on" : ""}`} onClick={() => { setPlatform(item.id); setGroup(""); setService(null); setStep(2); }}>
                  {item.label}
                </button>
              ))}
            </div>
            {step >= 2 ? (
              <div className="cp-chips" style={{ marginTop: 12 }}>
                {catalog.groups.map((item) => (
                  <button key={item} type="button" className={`cp-chip ${group === item ? "is-on" : ""}`} onClick={() => { setGroup(item); setStep(3); }}>
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
            {step >= 3 ? (
              <>
                <label className="cp-field" style={{ marginTop: 14 }}>
                  <span>Search services</span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or service ID" />
                </label>
                {catalog.services.map((item) => (
                  <button key={item.id} type="button" className={`cp-service ${service?.id === item.id ? "is-on" : ""}`} onClick={() => { setService(item); setQty(String(item.min)); setStep(4); }}>
                    <strong>{item.name}</strong>
                    <small> #{item.id} · ${item.ratePer1000}/1k · {item.min}–{item.max} · {item.status}</small>
                    <div className="cp-meta">{item.description}</div>
                    {item.avgTime ? <div className="cp-meta">Estimated: {item.avgTime}</div> : null}
                  </button>
                ))}
              </>
            ) : null}
          </>
        )}
      </section>
      <aside className="cp-card">
        <h3>Order details</h3>
        {!service ? <p>Select a service to continue.</p> : (
          <>
            <label className="cp-field"><span>Service URL</span><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></label>
            <label className="cp-field"><span>Quantity ({service.min}–{service.max})</span><input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" /></label>
            <p>Estimated cost ${charge.toFixed(4)}</p>
            <p>Wallet ${balance.toFixed(2)}</p>
            <button className="cp-btn" type="button" disabled={busy} onClick={() => setStep(5)}>Review order</button>
            {step === 5 ? (
              <div style={{ marginTop: 16 }}>
                <p>{service.platformLabel}</p>
                <p>{service.name}</p>
                <p>{link || "URL missing"}</p>
                <p>Qty {quantity || 0} · ${charge.toFixed(4)}</p>
                <button className="cp-btn" type="button" disabled={busy} onClick={() => void place()}>{busy ? "Placing…" : "Confirm & Place Order"}</button>
              </div>
            ) : null}
          </>
        )}
      </aside>
    </div>
  );
}

export function MassOrderView() {
  const [rows, setRows] = useState([{ serviceId: "", link: "", quantity: "" }]);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(0);
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/dashboard/session").then(async (res) => {
      if (res.ok) setBalance(((await res.json()) as { user: { balance: number } }).user.balance);
    });
  }, []);
  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/dashboard/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        rows: rows.map((row) => ({ serviceId: Number(row.serviceId), link: row.link, quantity: Number(row.quantity) })),
      }),
    });
    const data = (await res.json()) as { error?: string; orders?: { id: number }[]; balance?: number };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Orders were not placed.");
      return;
    }
    setResult((data.orders ?? []).map((order) => `#${order.id}`).join(", "));
    if (typeof data.balance === "number") setBalance(data.balance);
  }
  return (
    <section className="cp-card">
      <p>Wallet ${balance.toFixed(2)}. Each row is priced on the server. Nothing is charged unless every row is valid.</p>
      {error ? <p className="cp-error">{error}</p> : null}
      {result ? <p className="cp-ok">Placed {result}</p> : null}
      {rows.map((row, index) => (
        <div key={index} className="cp-grid" style={{ gridTemplateColumns: "140px 1fr 140px auto", marginBottom: 8 }}>
          <input placeholder="Service ID" value={row.serviceId} onChange={(e) => setRows(rows.map((item, i) => i === index ? { ...item, serviceId: e.target.value } : item))} />
          <input placeholder="https:// target" value={row.link} onChange={(e) => setRows(rows.map((item, i) => i === index ? { ...item, link: e.target.value } : item))} />
          <input placeholder="Quantity" value={row.quantity} onChange={(e) => setRows(rows.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item))} />
          <button type="button" className="cp-btn-ghost" onClick={() => setRows(rows.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}
      <div className="cp-row-actions">
        <button type="button" className="cp-btn-ghost" onClick={() => setRows([...rows, { serviceId: "", link: "", quantity: "" }])}>Add row</button>
        <button type="button" className="cp-btn" disabled={busy} onClick={() => void submit()}>Confirm all orders</button>
      </div>
    </section>
  );
}

type OrderRow = {
  id: number;
  createdAt: string;
  platformLabel: string;
  serviceName: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
};

export function OrdersView({ history = false }: { history?: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ orders: OrderRow[]; pages: number } | null>(null);
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (history) params.set("scope", "history");
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [q, status, from, to, page, history]);
  useEffect(() => {
    void fetch(`/api/dashboard/orders?${query}`).then(async (res) => {
      if (res.ok) setData((await res.json()) as { orders: OrderRow[]; pages: number });
    });
  }, [query]);
  return (
    <section className="cp-card">
      <div className="cp-grid" style={{ gridTemplateColumns: "1.4fr .8fr .7fr .7fr" }}>
        <input placeholder="Search order, URL, service" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Status">
          <option value="">All statuses</option>
          {["Pending", "Processing", "In progress", "Completed", "Partial", "Canceled", "Failed"].map((item) => <option key={item} value={item}>{item === "Canceled" ? "Cancelled" : item}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
      </div>
      {!data ? <Skeleton /> : data.orders.length === 0 ? <Empty title={history ? "No order history" : "No orders yet"} copy="Orders you place from this account appear here." href="/dashboard/new-order" cta="New order" /> : (
        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead><tr><th>Order</th><th>Date</th><th>Platform</th><th>Service</th><th>URL</th><th>Qty</th><th>Charge</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order">#{order.id}</td>
                  <td data-label="Date">{order.createdAt.slice(0, 10)}</td>
                  <td data-label="Platform">{order.platformLabel}</td>
                  <td data-label="Service">{order.serviceName}</td>
                  <td data-label="URL">{order.link}</td>
                  <td data-label="Quantity">{order.quantity}</td>
                  <td data-label="Charge">${order.charge.toFixed(4)}</td>
                  <td data-label="Status"><Badge status={order.status} /></td>
                  <td data-label="Actions"><Link href={`/dashboard/orders/${order.id}`}>Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cp-row-actions">
            <button type="button" className="cp-btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {page} / {data.pages}</span>
            <button type="button" className="cp-btn-ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function OrderDetailView({ id }: { id: string }) {
  const [order, setOrder] = useState<{
    id: number; serviceName: string; serviceId: number; platformLabel: string; link: string; quantity: number;
    charge: number; status: string; remains: number; startCount: number | null; progress: number | null;
    createdAt: string; updatedAt: string; refill: boolean; cancel: boolean;
  } | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void fetch(`/api/dashboard/orders/${id}`).then(async (res) => {
      if (res.ok) setOrder(((await res.json()) as { order: NonNullable<typeof order> }).order);
    });
  }, [id]);
  async function act(action: "refill" | "cancel") {
    const res = await fetch(`/api/dashboard/orders/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const data = (await res.json()) as { error?: string };
    setMessage(data.error || "Request sent to the provider.");
  }
  if (!order) return <Skeleton />;
  return (
    <section className="cp-card">
      <p className="cp-kicker">Order #{order.id}</p>
      <h2>{order.serviceName}</h2>
      <p>{order.platformLabel} · Service {order.serviceId}</p>
      <p>Target {order.link}</p>
      <p>Quantity {order.quantity}</p>
      <p>Start count {order.startCount ?? "Not reported yet"}</p>
      <p>Remaining {order.remains}</p>
      <p>Charge ${order.charge.toFixed(4)}</p>
      <p>Status <Badge status={order.status} /></p>
      <p>Created {order.createdAt}</p>
      <p>Updated {order.updatedAt}</p>
      {order.progress == null ? <p className="cp-note">Delivery progress is shown only after the provider reports a start count or remaining quantity.</p> : <p>Reported progress {order.progress}%</p>}
      <div className="cp-row-actions">
        {order.refill ? <button className="cp-btn-ghost" type="button" onClick={() => void act("refill")}>Request refill</button> : null}
        {order.cancel ? <button className="cp-btn-ghost" type="button" onClick={() => void act("cancel")}>Request cancel</button> : null}
      </div>
      {message ? <p>{message}</p> : null}
    </section>
  );
}

export function ServicesView({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const [platform, setPlatform] = useState("");
  const [q, setQ] = useState("");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    const params = new URLSearchParams();
    if (favoritesOnly) params.set("favorites", "1");
    if (platform) params.set("platform", platform);
    if (q) params.set("q", q);
    void fetch(`/api/dashboard/catalog?${params}`).then(async (res) => {
      if (res.ok) setCatalog((await res.json()) as Catalog);
    });
  }, [platform, q, favoritesOnly]);
  async function fav(serviceId: number) {
    const res = await fetch("/api/dashboard/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId }) });
    if (!res.ok || !catalog) return;
    const data = (await res.json()) as { ids: number[] };
    setCatalog({ ...catalog, favoriteIds: data.ids, services: favoritesOnly ? catalog.services.filter((service) => data.ids.includes(service.id)) : catalog.services });
  }
  if (!catalog) return <Skeleton />;
  return (
    <section className="cp-card">
      {!favoritesOnly ? (
        <>
          <div className="cp-platforms">
            <button type="button" className={`cp-chip ${platform === "" ? "is-on" : ""}`} onClick={() => setPlatform("")}>All</button>
            {catalog.platforms.map((item) => (
              <button key={item.id} type="button" className={`cp-chip ${platform === item.id ? "is-on" : ""}`} onClick={() => setPlatform(item.id)}>{item.label}</button>
            ))}
          </div>
          <label className="cp-field"><span>Search</span><input value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </>
      ) : null}
      {catalog.services.length === 0 ? <Empty title={favoritesOnly ? "No favorites" : "No services"} copy={favoritesOnly ? "Save services from the catalog." : "Try another platform or search."} href="/dashboard/services" cta="Browse services" /> : catalog.services.map((service) => (
        <article key={service.id} className="cp-service">
          <strong>{service.name}</strong>
          <div className="cp-meta">#{service.id} · {service.platformLabel} · {service.group} · ${service.ratePer1000}/1k · {service.min}–{service.max}</div>
          <div className="cp-row-actions">
            <Link href={`/dashboard/new-order`}>Order</Link>
            <button type="button" className="cp-btn-ghost" onClick={() => void fav(service.id)}>{catalog.favoriteIds.includes(service.id) ? "Unfavorite" : "Favorite"}</button>
          </div>
        </article>
      ))}
    </section>
  );
}
