"use client";

import { useState } from "react";
import { send, usd, useOrbit } from "@/components/orbit/use-orbit";

type Detail = {
  customer: { id: string; email: string; name: string | null; balance: number; suspended: boolean; apiKeyRevoked: boolean; createdAt: string; apiKeyMasked: string };
  orders: { id: number; service: string; link: string; quantity: number; charge: number; status: string; channel?: string; createdAt: string }[];
  api?: { id: string; at: string; action: string; ok: boolean; detail: string; ip: string; orderId: number | null; keyPrefix: string }[];
  ledger: { id: string; type: string; amount: number; description: string; createdAt: string }[];
  logins: { createdAt: string; method: string; ip: string }[];
  tickets: { id: string; subject: string; status: string }[];
};

export function CustomerDetailScreen({ id }: { id: string }) {
  const { data, error, reload } = useOrbit<Detail>(`/api/orbit/customers/${id}`);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [balance, setBalance] = useState("");
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
  return (
    <>
      <article className="ob-card">
        <h2 style={{ marginTop: 0 }}>{customer.name || customer.email}</h2>
        <p>{customer.email}</p>
        <p>Joined {customer.createdAt.slice(0, 10)} · Balance {usd(customer.balance)} · API {customer.apiKeyMasked}</p>
        <p>Status: {customer.suspended ? "Suspended" : "Active"}{customer.apiKeyRevoked ? " · API revoked" : ""}</p>
      </article>
      <form className="ob-form" onSubmit={(event) => { event.preventDefault(); patch({ name, reason: reason || "Profile edit" }); }}>
        <label>Name<input value={name} placeholder={customer.name || ""} onChange={(event) => setName(event.target.value)} /></label>
        <label>Set balance<input value={balance} onChange={(event) => setBalance(event.target.value)} /></label>
        <label>Reason<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for balance changes" /></label>
        <button className="ob-btn primary" type="submit">Save name</button>
        <button className="ob-btn" type="button" onClick={() => patch({ balance: Number(balance), reason })}>Set balance</button>
        <button className="ob-btn" type="button" onClick={() => patch({ suspended: !customer.suspended })}>{customer.suspended ? "Restore account" : "Suspend account"}</button>
        <button className="ob-btn" type="button" onClick={() => patch({ revoked: !customer.apiKeyRevoked })}>{customer.apiKeyRevoked ? "Restore API" : "Revoke API"}</button>
      </form>
      {message ? <p>{message}</p> : null}
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>Order</th><th>From</th><th>Service</th><th>Qty</th><th>Charge</th><th>Status</th></tr></thead>
          <tbody>{(data?.orders ?? []).map((order) => <tr key={order.id}><td>#{order.id}</td><td>{order.channel === "api" ? "API" : "Dashboard"}</td><td>{order.service}</td><td>{order.quantity}</td><td>{usd(order.charge)}</td><td>{order.status}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead><tr><th>When</th><th>Type</th><th>Amount</th><th>Detail</th></tr></thead>
          <tbody>{(data?.ledger ?? []).map((row) => <tr key={row.id}><td>{row.createdAt.slice(0, 16).replace("T", " ")}</td><td>{row.type}</td><td>{usd(row.amount)}</td><td>{row.description}</td></tr>)}</tbody>
        </table>
      </div>
      <article className="ob-card">
        <span>API connections</span>
        {(data?.api ?? []).length === 0 ? <p>This customer has not generated or called the API yet.</p> : (data?.api ?? []).map((row) => (
          <p key={row.id}>{row.at.slice(0, 16).replace("T", " ")} · {row.action} · {row.ok ? "OK" : "Failed"} · {row.detail} · {row.keyPrefix}… · {row.ip}</p>
        ))}
        <span>Logins</span>
        {data?.logins.map((row) => <p key={row.createdAt}>{row.createdAt.slice(0, 16).replace("T", " ")} · {row.method} · {row.ip}</p>)}
        <span>Tickets</span>
        {data?.tickets.map((ticket) => <p key={ticket.id}>{ticket.subject} · {ticket.status}</p>)}
      </article>
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
