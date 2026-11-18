"use client";

import { useState } from "react";
import { useOrbit } from "@/components/orbit/use-orbit";

type Row = {
  id: number;
  localId: number;
  name: string;
  category: string;
  type: string;
  costPer1000: number;
  ratePer1000: number;
  defaultRatePer1000: number;
  manualPrice: number | null;
  min: number;
  max: number;
};

type Summary = {
  provider: { id: string; name: string; endpoint: string; markupPercent: number; hasKey: boolean; lastStatus: string } | null;
  syncedAt: string | null;
  markupPercent: number;
  categoryPrice: number | null;
  serviceCount: number;
  categoryCount: number;
  categories: { name: string; count: number }[];
  category: string;
  services: Row[];
  orders: { id: number; upstreamOrderId: string | null; upstreamServiceId: number | null; customer: string; service: string; quantity: number; charge: number; status: string; createdAt: string }[];
};

export function ServerApiScreen() {
  const [category, setCategory] = useState("");
  const { data, error, reload } = useOrbit<Summary>(`/api/orbit/server-api${category ? `?category=${encodeURIComponent(category)}` : ""}`);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("https://honestsmm.com/api/v2");
  const [markup, setMarkup] = useState("30");
  const [categoryPrice, setCategoryPrice] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const active = category || data?.category || "";

  async function post(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setMessage("");
    try {
      const response = await fetch("/api/orbit/server-api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: data?.provider?.id,
          name: "HonestSMM",
          endpoint: endpoint || data?.provider?.endpoint,
          apiKey,
          markupPercent: Number(markup) || 30,
          ...body,
        }),
      });
      const payload = (await response.json()) as { error?: string; balance?: string; currency?: string; services?: number; categories?: number };
      setApiKey("");
      setMessage(response.ok ? successMessage(String(body.action), payload) : payload.error || "Request failed.");
      if (response.ok) reload();
    } catch {
      setMessage("The request could not be completed.");
    } finally {
      setBusy("");
    }
  }

  const services = data?.services ?? [];

  return (
    <>
      <section className="ob-banker-hero">
        <div>
          <span className="ob-hero-tag">SMM · Service API</span>
          <h2>HonestSMM</h2>
          <p>Every category and service comes from the Server API. Editing a price here is the price the customer pays.</p>
        </div>
        <div className="ob-banker-stats">
          <div className="ob-banker-stat"><span>Services</span><strong>{data?.serviceCount ?? 0}</strong></div>
          <div className="ob-banker-stat"><span>Categories</span><strong>{data?.categoryCount ?? 0}</strong></div>
          <div className="ob-banker-stat"><span>Markup</span><strong>{data?.markupPercent ?? 30}%</strong></div>
          <div className="ob-banker-stat"><span>Key</span><strong>{data?.provider?.hasKey ? "Saved" : "Missing"}</strong></div>
        </div>
      </section>
      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p className="ob-note">{message}</p> : null}

      <form className="ob-form ob-card" onSubmit={(event) => { event.preventDefault(); void post({ action: "save", markupPercent: Number(markup) || 30 }, "save"); }}>
        <h3>Connection</h3>
        <label>API URL<input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} /></label>
        <label>API key<input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={data?.provider?.hasKey ? "Saved on the server" : "Paste the HonestSMM API key"} autoComplete="off" /></label>
        <label>Markup percent<input value={markup} onChange={(event) => setMarkup(event.target.value)} inputMode="decimal" /></label>
        <p className="ob-muted">Markup applies to services without a manual price. Saving the markup reprices the whole catalog.</p>
        <div className="ob-toolbar">
          <button className="ob-btn primary" type="submit" disabled={busy === "save"}>{busy === "save" ? "Saving…" : "Save"}</button>
          <button className="ob-btn" type="button" disabled={busy === "balance"} onClick={() => void post({ action: "balance" }, "balance")}>{busy === "balance" ? "Checking…" : "Check balance"}</button>
          <button className="ob-btn" type="button" disabled={busy === "sync"} onClick={() => void post({ action: "sync" }, "sync")}>{busy === "sync" ? "Syncing…" : "Sync services"}</button>
        </div>
      </form>

      <div className="ob-split">
        <article className="ob-card" style={{ maxHeight: 640, overflow: "auto" }}>
          <h3>Categories</h3>
          <div className="ob-toolbar" style={{ flexDirection: "column", alignItems: "stretch" }}>
            {(data?.categories ?? []).map((item) => (
              <button key={item.name} type="button" className={`ob-btn${active === item.name ? " primary" : ""}`} onClick={() => { setCategory(item.name); setEditing(null); }}>
                {item.name} · {item.count}
              </button>
            ))}
          </div>
        </article>

        <div className="ob-card" style={{ padding: 0 }}>
          <form
            className="ob-toolbar"
            style={{ padding: "14px 16px" }}
            onSubmit={(event) => { event.preventDefault(); void post({ action: "category-price", category: active, price: categoryPrice === "" ? null : Number(categoryPrice) }, "category-price"); }}
          >
            <strong style={{ flex: "1 1 100%" }}>{active || "Category"}</strong>
            <label style={{ flex: 1 }}>
              Category server price per 1k
              <input value={categoryPrice} onChange={(event) => setCategoryPrice(event.target.value)} placeholder={data?.categoryPrice != null ? String(data.categoryPrice) : "Automatic"} inputMode="decimal" />
            </label>
            <button className="ob-btn primary" type="submit" disabled={!active || busy === "category-price"}>{busy === "category-price" ? "Saving…" : "Save category price"}</button>
            <button className="ob-btn" type="button" onClick={() => void post({ action: "category-price", category: active, price: null }, "category-price")}>Use automatic</button>
          </form>
          <div className="ob-table-wrap">
            <table className="ob-table">
              <thead>
                <tr>
                  <th>Server ID</th>
                  <th>Service</th>
                  <th>Real rate / 1k</th>
                  <th>Your price / 1k</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {services.length ? services.map((row) => (
                  <tr key={row.localId}>
                    <td>{row.id}</td>
                    <td>{row.name}</td>
                    <td>${row.costPer1000.toFixed(4)}</td>
                    <td>
                      {editing === row.localId ? (
                        <input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder={String(row.ratePer1000)} autoFocus />
                      ) : (
                        <>
                          ${row.ratePer1000.toFixed(4)}
                          {row.manualPrice != null ? <div className="ob-muted">Manual</div> : null}
                        </>
                      )}
                    </td>
                    <td>{row.min}</td>
                    <td>{row.max}</td>
                    <td>
                      <div className="ob-toolbar">
                        {editing === row.localId ? (
                          <>
                            <button className="ob-btn primary" type="button" disabled={busy === `price-${row.localId}`} onClick={async () => {
                              await post({ action: "service-price", localId: row.localId, price: Number(price) }, `price-${row.localId}`);
                              setEditing(null);
                              setPrice("");
                            }}>Save</button>
                            <button className="ob-btn" type="button" onClick={() => { setEditing(null); setPrice(""); }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="ob-btn" type="button" onClick={() => { setEditing(row.localId); setPrice(String(row.ratePer1000)); }}>Edit price</button>
                            {row.manualPrice != null ? (
                              <button className="ob-btn" type="button" onClick={() => void post({ action: "service-price", localId: row.localId, price: null }, `price-${row.localId}`)}>Auto</button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7}>Sync services to load the real HonestSMM categories.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="ob-table-wrap ob-card" style={{ padding: 0, marginTop: 16 }}>
        <table className="ob-table">
          <thead>
            <tr>
              <th>Your order</th>
              <th>Server API order</th>
              <th>Server service</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Qty</th>
              <th>Charge</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.orders.length ? data.orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.upstreamOrderId}</td>
                <td>{order.upstreamServiceId ?? "—"}</td>
                <td>{order.customer}</td>
                <td>{order.service}</td>
                <td>{order.quantity}</td>
                <td>${order.charge.toFixed(4)}</td>
                <td>{order.status}</td>
              </tr>
            )) : (
              <tr><td colSpan={8}>No order has been sent to the Server API yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function successMessage(action: string, payload: { balance?: string; currency?: string; services?: number; categories?: number }) {
  if (action === "balance") return `Server balance ${payload.balance || "—"} ${payload.currency || ""}`.trim();
  if (action === "sync") return `Synced ${payload.services ?? 0} services in ${payload.categories ?? 0} categories.`;
  if (action === "service-price" || action === "category-price") return "Price saved. The customer catalog uses it now.";
  return "Service API saved.";
}
