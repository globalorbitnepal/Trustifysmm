"use client";

import { useState } from "react";
import { useOrbit } from "@/components/orbit/use-orbit";

type Row = {
  id: number;
  localId: number;
  name: string;
  category: string;
  costPer1000: number;
  ratePer1000: number;
  min: number;
  max: number;
};

type Summary = {
  provider: { id: string; name: string; endpoint: string; markupPercent: number; hasKey: boolean; lastStatus: string } | null;
  syncedAt: string | null;
  markupPercent: number;
  serviceCount: number;
  categoryCount: number;
  categories: { name: string; count: number }[];
  category: string;
  services: Row[];
};

export function ServerApiScreen() {
  const [category, setCategory] = useState("");
  const { data, error, reload } = useOrbit<Summary>(`/api/orbit/server-api${category ? `?category=${encodeURIComponent(category)}` : ""}`);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("https://honestsmm.com/api/v2");
  const [markup, setMarkup] = useState("30");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const active = category || data?.category || "";

  async function post(action: string) {
    setBusy(action);
    setMessage("");
    const response = await fetch("/api/orbit/server-api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        id: data?.provider?.id,
        name: "HonestSMM",
        endpoint: endpoint || data?.provider?.endpoint,
        apiKey,
        markupPercent: Number(markup) || 30,
      }),
    });
    const payload = (await response.json()) as { error?: string; balance?: string; currency?: string; services?: number; categories?: number };
    setBusy("");
    setApiKey("");
    setMessage(
      response.ok
        ? action === "balance"
          ? `Server balance ${payload.balance || "—"} ${payload.currency || ""}`.trim()
          : action === "sync"
            ? `Synced ${payload.services ?? 0} services in ${payload.categories ?? 0} categories.`
            : "Service API saved."
        : payload.error || "Request failed.",
    );
    reload();
  }

  return (
    <>
      <section className="ob-banker-hero">
        <div>
          <span className="ob-hero-tag">SMM · Service API</span>
          <h2>HonestSMM</h2>
          <p>Real server rate, then 30% added for the customer. Categories and services use the same dashboard design.</p>
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
      <form className="ob-form ob-card" onSubmit={(event) => { event.preventDefault(); void post("save"); }}>
        <h3>Connection</h3>
        <label>API URL<input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} /></label>
        <label>API key<input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={data?.provider?.hasKey ? "Saved on the server" : "Paste the HonestSMM API key"} autoComplete="off" /></label>
        <label>Markup percent<input value={markup} onChange={(event) => setMarkup(event.target.value)} inputMode="decimal" /></label>
        <div className="ob-toolbar">
          <button className="ob-btn primary" type="submit" disabled={busy === "save"}>{busy === "save" ? "Saving…" : "Save"}</button>
          <button className="ob-btn" type="button" disabled={busy === "balance"} onClick={() => void post("balance")}>{busy === "balance" ? "Checking…" : "Check balance"}</button>
          <button className="ob-btn" type="button" disabled={busy === "sync"} onClick={() => void post("sync")}>{busy === "sync" ? "Syncing…" : "Sync services"}</button>
        </div>
      </form>
      <div className="ob-split">
        <article className="ob-card" style={{ maxHeight: 640, overflow: "auto" }}>
          <h3>Categories</h3>
          <div className="ob-toolbar" style={{ flexDirection: "column", alignItems: "stretch" }}>
            {(data?.categories ?? []).map((item) => (
              <button key={item.name} type="button" className={`ob-btn${active === item.name ? " primary" : ""}`} onClick={() => setCategory(item.name)}>
                {item.name} · {item.count}
              </button>
            ))}
          </div>
        </article>
        <div className="ob-table-wrap ob-card" style={{ padding: 0 }}>
          <table className="ob-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Service</th>
                <th>Real rate / 1k</th>
                <th>Customer rate / 1k</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {data?.services.length ? data.services.map((row) => (
                <tr key={row.localId}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>${row.costPer1000.toFixed(4)}</td>
                  <td>${row.ratePer1000.toFixed(4)}</td>
                  <td>{row.min}</td>
                  <td>{row.max}</td>
                </tr>
              )) : (
                <tr><td colSpan={6}>Sync services to load the real HonestSMM categories.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
