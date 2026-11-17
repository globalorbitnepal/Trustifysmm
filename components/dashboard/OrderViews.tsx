"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Empty, Skeleton } from "@/components/dashboard/OverviewView";
import { PlatformFilterIcon } from "@/components/PlatformFilterIcon";
import { ServiceCatalogUI } from "@/components/dashboard/ServiceCatalogUI";

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
  const [allPlatforms, setAllPlatforms] = useState<{ id: string; label: string }[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [balance, setBalance] = useState(0);
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
        if (res.ok) {
          const next = (await res.json()) as Catalog;
          setCatalog(next);
          if (!platform && !group && !q) setAllPlatforms(next.platforms);
        }
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [platform, group, q]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("service");
    if (!id || !catalog) return;
    const picked = catalog.services.find((item) => item.id === Number(id));
    if (picked) {
      setService(picked);
      setQty(String(picked.min));
      setPlatform(picked.platform);
      setGroup(picked.group);
    }
  }, [catalog]);

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
        <p className="cp-kicker">New order</p>
        {error ? <p className="cp-error">{error}</p> : null}
        {!catalog ? <Skeleton /> : (
          <>
            <div className="cp-plat-grid-premium" role="tablist" aria-label="Platforms">
              <button type="button" className={`cp-plat-card ${platform === "" ? "is-on" : ""}`} onClick={() => { setPlatform(""); setGroup(""); setService(null); }}>
                <PlatformFilterIcon platform="all" className="cp-plat-mark" variant="glass" />
                <span>All</span>
              </button>
              {(allPlatforms.length ? allPlatforms : catalog.platforms).map((item) => (
                <button key={item.id} type="button" className={`cp-plat-card ${platform === item.id ? "is-on" : ""}`} onClick={() => { setPlatform(item.id); setGroup(""); setService(null); }}>
                  <PlatformFilterIcon platform={item.id} className="cp-plat-mark" variant="glass" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <label className="cp-field">
              <span>Category</span>
              <select value={group} onChange={(event) => { setGroup(event.target.value); setService(null); }}>
                <option value="">All categories</option>
                {catalog.groups.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="cp-field">
              <span>Search</span>
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Service name or ID" />
            </label>
            <label className="cp-field">
              <span>Service</span>
              <select
                value={service?.id ?? ""}
                onChange={(event) => {
                  const next = catalog.services.find((item) => item.id === Number(event.target.value)) ?? null;
                  setService(next);
                  if (next) setQty(String(next.min));
                }}
              >
                <option value="">Choose a service</option>
                {catalog.services.slice(0, 80).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} — {item.name} — ${item.ratePer1000}/1k
                  </option>
                ))}
              </select>
            </label>
            <label className="cp-field">
              <span>Link</span>
              <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" />
            </label>
            <label className="cp-field">
              <span>Quantity {service ? `· min ${service.min} · max ${service.max}` : ""}</span>
              <input value={qty} onChange={(event) => setQty(event.target.value)} inputMode="numeric" />
            </label>
            <div className="cp-charge">
              <span>Charge</span>
              <strong>${charge.toFixed(4)}</strong>
              <em>Wallet ${balance.toFixed(2)}</em>
            </div>
            <button className="cp-btn cp-btn-wide" type="button" disabled={busy || !service} onClick={() => void place()}>{busy ? "Placing…" : "Place order"}</button>
          </>
        )}
      </section>
      <aside className="cp-card cp-details">
        <h3>Service details</h3>
        {!service ? <p>Pick a platform, category and service. Price, limits and timing show here before you pay.</p> : (
          <dl className="cp-spec">
            <div><dt>Service</dt><dd>#{service.id}</dd></div>
            <div><dt>Rate</dt><dd>${service.ratePer1000} / 1,000</dd></div>
            <div><dt>Start time</dt><dd>{service.avgTime || "Shown after the provider accepts"}</dd></div>
            <div><dt>Average time</dt><dd>{service.avgTime || "—"}</dd></div>
            <div><dt>Min / max</dt><dd>{service.min.toLocaleString()} – {service.max.toLocaleString()}</dd></div>
            <div><dt>Status</dt><dd>{service.status}</dd></div>
            <div className="cp-spec-wide"><dt>Description</dt><dd>{service.description || "No extra description on this service."}</dd></div>
          </dl>
        )}
      </aside>
    </div>
  );
}

export function MassOrderView() {
  const [text, setText] = useState("");
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
    const rows = text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [serviceId, link, quantity] = line.split("|");
      return { serviceId: Number(serviceId), link: (link || "").trim(), quantity: Number(quantity) };
    });
    if (!rows.length || rows.some((row) => !row.serviceId || !row.link || !row.quantity)) {
      setError("Each line must be service_id|link|quantity");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/dashboard/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), rows }),
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
    <div className="cp-grid cp-split">
      <section className="cp-card">
        <p className="cp-kicker">Mass order</p>
        <p>One order per line: <code>service_id|link|quantity</code></p>
        <p className="cp-note">Wallet ${balance.toFixed(2)}. Every line is priced on the server. Nothing is charged unless the whole batch is valid.</p>
        {error ? <p className="cp-error">{error}</p> : null}
        {result ? <p className="cp-ok">Placed {result}</p> : null}
        <textarea className="cp-mass" value={text} onChange={(event) => setText(event.target.value)} rows={12} placeholder={"2410|https://instagram.com/p/example|1000"} />
        <button className="cp-btn cp-btn-wide" type="button" disabled={busy} onClick={() => void submit()}>{busy ? "Placing…" : "Submit"}</button>
      </section>
      <aside className="cp-card">
        <h3>How mass order works</h3>
        <p>Use the service ID from Services, then the profile or post link, then the quantity.</p>
        <p>Example for 1,000 on three links with service 2410:</p>
        <ul className="cp-example">
          <li>2410|https://instagram.com/p/one|1000</li>
          <li>2410|https://instagram.com/p/two|1000</li>
          <li>2410|https://instagram.com/p/three|1000</li>
        </ul>
      </aside>
    </div>
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
      <div className="cp-status-tabs" role="tablist" aria-label="Order status">
        {["", "Pending", "Processing", "In progress", "Completed", "Partial", "Canceled"].map((item) => (
          <button key={item || "all"} type="button" className={status === item ? "is-on" : ""} onClick={() => { setPage(1); setStatus(item); }}>
            {item === "" ? "All" : item === "Canceled" ? "Cancelled" : item}
          </button>
        ))}
      </div>
      <div className="cp-grid" style={{ gridTemplateColumns: "1.4fr .7fr .7fr", marginBottom: 12 }}>
        <input placeholder="Search order, URL, service" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
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
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    const params = new URLSearchParams();
    if (favoritesOnly) params.set("favorites", "1");
    if (platform) params.set("platform", platform);
    if (group) params.set("group", group);
    if (q) params.set("q", q);
    const handle = setTimeout(() => {
      void fetch(`/api/dashboard/catalog?${params}`).then(async (res) => {
        if (res.ok) setCatalog((await res.json()) as Catalog);
      });
    }, 180);
    return () => clearTimeout(handle);
  }, [platform, group, q, favoritesOnly]);
  async function fav(serviceId: number) {
    const res = await fetch("/api/dashboard/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId }) });
    if (!res.ok || !catalog) return;
    const data = (await res.json()) as { ids: number[] };
    setCatalog({
      ...catalog,
      favoriteIds: data.ids,
      services: favoritesOnly ? catalog.services.filter((service) => data.ids.includes(service.id)) : catalog.services,
    });
  }
  return (
    <section className="cp-card cp-card--catalog">
      <p className="cp-kicker">{favoritesOnly ? "Favorites" : "Services catalog"}</p>
      <ServiceCatalogUI
        catalog={catalog}
        platform={platform}
        group={group}
        query={q}
        onPlatform={(id) => { setPlatform(id); setGroup(""); }}
        onGroup={setGroup}
        onQuery={setQ}
        favoritesOnly={favoritesOnly}
        onFavorite={(id) => void fav(id)}
        showPlatforms={!favoritesOnly}
      />
    </section>
  );
}
