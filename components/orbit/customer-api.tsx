"use client";

import Link from "next/link";
import { useOrbit } from "@/components/orbit/use-orbit";

type EventRow = {
  id: string;
  at: string;
  userId: string | null;
  email: string | null;
  action: string;
  ip: string;
  ok: boolean;
  detail: string;
  orderId: number | null;
  keyPrefix: string;
};

export function CustomerApiScreen() {
  const { data, error } = useOrbit<{ events: EventRow[] }>("/api/orbit/customer-api");
  const events = data?.events ?? [];
  return (
    <>
      <article className="ob-card">
        <h2 style={{ marginTop: 0 }}>Customer API</h2>
        <p>Every key is generated inside a customer account. A connection, a balance check and an order all show here with that customer. An API order charges the same wallet as the dashboard.</p>
      </article>
      {error ? <p className="ob-error">{error}</p> : null}
      <p className="ob-muted">{data ? `${events.length} recent API events` : "Loading API events…"}</p>
      <div className="ob-table-wrap">
        <table className="ob-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Customer</th>
              <th>Action</th>
              <th>Result</th>
              <th>Order</th>
              <th>Key</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan={7}>No customer has generated or called the API yet.</td></tr>
            ) : events.map((event) => (
              <tr key={event.id}>
                <td>{event.at.slice(0, 16).replace("T", " ")}</td>
                <td>{event.userId ? <Link href={`/orbit/customers/${event.userId}`}>{event.email || event.userId}</Link> : event.email || "Unknown key"}</td>
                <td>{event.action}</td>
                <td>{event.ok ? "OK" : "Failed"} · {event.detail}</td>
                <td>{event.orderId ? `#${event.orderId}` : "—"}</td>
                <td><code>{event.keyPrefix}…</code></td>
                <td>{event.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
