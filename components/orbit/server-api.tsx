"use client";

import { useState } from "react";
import { useOrbit } from "@/components/orbit/use-orbit";

type Summary = {
  provider: { id: string; name: string; endpoint: string; markupPercent: number; hasKey: boolean; lastStatus: string } | null;
  syncedAt: string | null;
  serviceCount: number;
  categoryCount: number;
  preview: { id: number; localId: number; name: string; category: string; costPer1000: number; ratePer1000: number; min: number; max: number }[];
};

export function ServerApiScreen() {
  const { data, error, reload } = useOrbit<Summary>("/api/orbit/server-api");
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("https://honestsmm.com/api/v2");
  const [markup, setMarkup] = useState("35");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function post(action: string, extra: Record<string, unknown> = {}) {
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
        markupPercent: Number(markup) || 35,
        ...extra,
      }),
    });
    const payload = (await response.json()) as { error?: string; balance?: string; currency?: string; services?: number; categories?: number };
    setBusy("");
    setMessage(response.ok ? actionMessage(action, payload) : payload.error || "Request failed.");
    setApiKey("");
    reload();
  }

  return (
    <>
      <section className="ob-banker-hero">
        <div>
          <span className="ob-hero-tag">SMM · Server API</span>
          <h2>HonestSMM</h2>
          <p>Services and categories come from this server. Customer prices are the server rate plus {markup || "35"}%. A placed order is sent to the server automatically.</p>
        </div>
      </section>
      {error ? <p className="ob-error">{error}</p> : null}
      {message ? <p className="ob-note">{message}</p> : null}
      <form
        className="ob-form ob-card"
        onSubmit={(event) => {
          event.preventDefault();
          void post("save");
        }}
      >
        <h3>Connection</h3>
        <label>
          API URL
          <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} />
        </label>
        <label>
          API key
          <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={data?.provider?.hasKey ? "Saved — enter a new key to replace it" : "Paste the HonestSMM API key"} autoComplete="off" />
        </label>
        <label>
          Markup percent
          <input value={markup} onChange={(event) => setMarkup(event.target.value)} inputMode="decimal" />
        </label>
        <p className="ob-muted">Status: {data?.provider?.lastStatus || "Not connected"} · {data?.serviceCount ?? 0} services · {data?.categoryCount ?? 0} categories{data?.syncedAt ? ` · synced ${data.syncedAt.slice(0, 16).replace("T", " ")}` : ""}</p>
        <div className="ob-toolbar">
          <button className="ob-btn primary" type="submit" disabled={busy === "save"}>{busy === "save" ? "Saving…" : "Save key"}</button>
          <button className="ob-btn" type="button" disabled={busy === "balance"} onClick={() => void post("balance")}>{busy === "balance" ? "Checking…" : "Check balance"}</button>
          <button className="ob-btn" type="button" disabled={busy === "sync"} onClick={() => void post("sync")}>{busy === "sync" ? "Syncing…" : "Sync services"}</button>
        </div>
      </form>
      <div className="ob-table-wrap ob-card" style={{ padding: 0 }}>
        <table className="ob-table">
          <thead>
            <tr>
              <th>Server ID</th>
              <th>Category</th>
              <th>Service</th>
              <th>Server price / 1k</th>
              <th>Your price / 1k</th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {data?.preview.length ? data.preview.map((row) => (
              <tr key={row.localId}>
                <td>{row.id}</td>
                <td>{row.category}</td>
                <td>{row.name}</td>
                <td>${row.costPer1000.toFixed(4)}</td>
                <td>${row.ratePer1000.toFixed(4)}</td>
                <td>{row.min}</td>
                <td>{row.max}</td>
              </tr>
            )) : (
              <tr><td colSpan={7}>Save the API key, then sync services. The first 40 rows are shown here. The full list is published to the catalog.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function actionMessage(action: string, payload: { balance?: string; currency?: string; services?: number; categories?: number }) {
  if (action === "balance") return payload.balance ? `Server balance ${payload.balance} ${payload.currency || ""}`.trim() : "Balance checked.";
  if (action === "sync") return `Synced ${payload.services ?? 0} services in ${payload.categories ?? 0} categories.`;
  return "Server API saved.";
}
