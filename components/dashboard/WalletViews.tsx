"use client";

import { useEffect, useState } from "react";
import { Empty, Skeleton } from "@/components/dashboard/OverviewView";

type Payment = {
  id: string;
  amountUsd: number;
  payCurrency: string | null;
  payAmount: string | null;
  address: string | null;
  payUrl: string | null;
  txHash: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
};

const LABELS: Record<string, string> = {
  pending: "Awaiting Payment",
  confirming: "Confirming",
  paid: "Credited",
  expired: "Expired",
  failed: "Failed",
};

export function AddFundsView() {
  const [balance, setBalance] = useState(0);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const [coin, setCoin] = useState("");
  const [amount, setAmount] = useState("10");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetch("/api/dashboard/payments").then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as { balance: number; gateway: { live: boolean; currencies: string[] } };
      setBalance(data.balance);
      setLive(data.gateway.live);
      setCurrencies(data.gateway.currencies);
      setCoin(data.gateway.currencies[0] || "");
      setReady(true);
    });
  }, []);

  async function createInvoice() {
    setError("");
    const res = await fetch("/api/dashboard/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), payCurrency: coin }),
    });
    const data = (await res.json()) as {
      error?: string;
      invoice_id?: string;
      pay_address?: string | null;
      pay_amount?: string | null;
      pay_currency?: string | null;
      payment_url?: string | null;
      expires_at?: string | null;
      status?: string;
    };
    if (!res.ok || !data.invoice_id) {
      setError(data.error || "Deposit could not be created.");
      return;
    }
    setPayment({
      id: data.invoice_id,
      amountUsd: Number(amount),
      payCurrency: data.pay_currency ?? coin,
      payAmount: data.pay_amount ?? null,
      address: data.pay_address ?? null,
      payUrl: data.payment_url ?? null,
      txHash: null,
      status: data.status || "pending",
      createdAt: new Date().toISOString(),
      expiresAt: data.expires_at ?? null,
    });
  }

  async function submitHash() {
    if (!payment) return;
    const res = await fetch(`/api/dashboard/payments/${payment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: hash }),
    });
    const data = (await res.json()) as { error?: string };
    setNote(data.error || "Hash saved. The wallet is credited only after the gateway confirms the payment.");
  }

  if (!ready) return <Skeleton />;
  return (
    <div className="cp-grid cp-split">
      <section className="cp-card">
        <p className="cp-kicker">Wallet</p>
        <h2>${balance.toFixed(2)} USD</h2>
        <p>TrustifySMM credits crypto deposits only after the payment gateway confirms them.</p>
      </section>
      <section className="cp-card">
        {!live ? (
          <Empty title="Crypto gateway unavailable" copy="Deposits open when NOWPAYMENTS_API_KEY and NOWPAYMENTS_IPN_SECRET are set on the server. No balance is added until that confirmation exists." />
        ) : (
          <>
            <p className="cp-label">Pay with</p>
            <div className="cp-plat-grid">
              {currencies.map((item) => (
                <button key={item} type="button" className={`cp-plat ${coin === item ? "is-on" : ""}`} onClick={() => setCoin(item)}>{item.toUpperCase()}</button>
              ))}
            </div>
            <label className="cp-field"><span>Amount (USD)</span><input value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
            {error ? <p className="cp-error">{error}</p> : null}
            <button className="cp-btn" type="button" onClick={() => void createInvoice()}>Generate deposit</button>
            {payment ? (
              <div>
                <p>Deposit {payment.id}</p>
                <p>Status {LABELS[payment.status] || payment.status}</p>
                <p>Pay {payment.payAmount || "the quoted amount"} {payment.payCurrency}</p>
                {payment.address ? (
                  <p>Address <button type="button" className="cp-btn-ghost" onClick={() => void navigator.clipboard.writeText(payment.address || "")}>{payment.address}</button></p>
                ) : null}
                {payment.payUrl ? <p><a href={payment.payUrl}>Open gateway invoice</a></p> : null}
                {payment.expiresAt ? <p>Expires {payment.expiresAt}</p> : null}
                <label className="cp-field"><span>Transaction hash (optional, does not credit funds)</span><input value={hash} onChange={(e) => setHash(e.target.value)} /></label>
                <button className="cp-btn-ghost" type="button" onClick={() => void submitHash()}>Submit hash</button>
                {note ? <p>{note}</p> : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

export function PaymentsView() {
  const [rows, setRows] = useState<Payment[] | null>(null);
  useEffect(() => {
    void fetch("/api/dashboard/payments").then(async (res) => {
      if (res.ok) setRows(((await res.json()) as { payments: Payment[] }).payments);
    });
  }, []);
  if (!rows) return <Skeleton />;
  if (rows.length === 0) return <section className="cp-card"><Empty title="No payment history" copy="Confirmed and pending crypto deposits will be listed here." href="/dashboard/add-funds" cta="Add funds" /></section>;
  return (
    <section className="cp-card cp-table-wrap">
      <table className="cp-table">
        <thead><tr><th>Deposit</th><th>Currency</th><th>Amount</th><th>Hash</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label="Deposit">{row.id}</td>
              <td data-label="Currency">{row.payCurrency || "—"}</td>
              <td data-label="Amount">${row.amountUsd.toFixed(2)}</td>
              <td data-label="Hash">{row.txHash || "—"}</td>
              <td data-label="Status">{LABELS[row.status] || row.status}</td>
              <td data-label="Date">{row.createdAt.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function TransactionsView() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [rows, setRows] = useState<{ id: string; type: string; description: string; amount: number; balanceAfter: number; status: string; date: string }[] | null>(null);
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    void fetch(`/api/dashboard/transactions?${params}`).then(async (res) => {
      if (res.ok) setRows(((await res.json()) as { transactions: NonNullable<typeof rows> }).transactions);
    });
  }, [q, type]);
  return (
    <section className="cp-card">
      <div className="cp-row-actions">
        <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">All types</option>
          <option value="deposit">Deposit</option>
          <option value="order">Order payment</option>
          <option value="refund">Refund</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>
      {!rows ? <Skeleton /> : rows.length === 0 ? <Empty title="No transactions" copy="Wallet deposits and order charges are recorded here." /> : (
        <table className="cp-table">
          <thead><tr><th>ID</th><th>Type</th><th>Description</th><th>Amount</th><th>Balance after</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td data-label="ID">{row.id}</td>
                <td data-label="Type">{row.type}</td>
                <td data-label="Description">{row.description}</td>
                <td data-label="Amount">{row.amount.toFixed(4)}</td>
                <td data-label="Balance after">{row.balanceAfter.toFixed(4)}</td>
                <td data-label="Status">{row.status}</td>
                <td data-label="Date">{row.date.slice(0, 16).replace("T", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
