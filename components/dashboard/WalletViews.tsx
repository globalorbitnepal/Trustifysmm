"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CryptoBrandIcon, type CryptoId } from "@/components/CryptoBrandIcon";
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
  pending: "Awaiting payment",
  confirming: "Confirming on-chain",
  paid: "Credited",
  expired: "Expired",
  failed: "Failed",
};

const PRESETS = [10, 25, 50, 100, 250] as const;

function resolveCryptoId(code: string): CryptoId | null {
  const key = code.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key.startsWith("btc") || key === "bitcoin") return "btc";
  if (key.startsWith("eth")) return "eth";
  if (key.startsWith("usdt") || key.startsWith("usdterc") || key.startsWith("usdttrc")) return "usdt";
  if (key.startsWith("sol")) return "sol";
  return null;
}

function statusTone(status: string): string {
  if (status === "paid") return "ok";
  if (status === "confirming") return "warn";
  if (status === "pending") return "pending";
  return "dim";
}

export function AddFundsView() {
  const [balance, setBalance] = useState(0);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const [coin, setCoin] = useState("");
  const [amount, setAmount] = useState("25");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
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
    setBusy(false);
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
    setNote("");
    setHash("");
  }

  async function submitHash() {
    if (!payment) return;
    const res = await fetch(`/api/dashboard/payments/${payment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: hash }),
    });
    const data = (await res.json()) as { error?: string };
    setNote(data.error || "Hash saved. Balance updates only after the gateway confirms payment.");
  }

  if (!ready) return <Skeleton rows={3} />;

  return (
    <div className="cp-funds">
      <section className="cp-card cp-funds-hero" aria-labelledby="cp-funds-title">
        <div className="cp-funds-hero-main">
          <p className="cp-kicker">Banker · crypto wallet</p>
          <h2 id="cp-funds-title" className="cp-funds-balance">
            ${balance.toFixed(2)}
          </h2>
          <p className="cp-funds-sub">USD balance — deposits via secure crypto gateway only</p>
        </div>
        <div className="cp-funds-hero-side">
          <span className={`cp-funds-pill${live ? " is-live" : " is-off"}`}>{live ? "Gateway live" : "Gateway offline"}</span>
          <span className="cp-funds-pill is-muted">NOWPayments · IPN verified</span>
        </div>
      </section>

      <div className="cp-funds-grid">
        <section className="cp-card cp-glass-panel cp-funds-panel">
          {!live ? (
            <div className="cp-funds-offline">
              <div className="cp-funds-offline-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 2.2 6.5 3.2L12 11.6 5.5 8.4 12 5.2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9 14h6M12 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Crypto deposits paused</h3>
              <p>
                The payment gateway is not configured on this server. Set <code>NOWPAYMENTS_API_KEY</code> and{" "}
                <code>NOWPAYMENTS_IPN_SECRET</code> — no balance is added without gateway confirmation.
              </p>
              <ul className="cp-funds-trust">
                <li>Funds credit only after on-chain + webhook verification</li>
                <li>Manual screenshots never add balance</li>
                <li>Full audit trail in Payment History</li>
              </ul>
              <Link className="cp-btn-ghost" href="/dashboard/payments">
                View payment history
              </Link>
            </div>
          ) : (
            <>
              <header className="cp-funds-panel-head">
                <h3>New crypto deposit</h3>
                <p>Choose a coin, set USD amount, and generate a secure invoice.</p>
              </header>

              <p className="cp-label">Pay with</p>
              <div className="cp-funds-coins" role="listbox" aria-label="Pay currency">
                {currencies.map((item) => {
                  const brand = resolveCryptoId(item);
                  const on = coin === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={`cp-funds-coin${on ? " is-on" : ""}`}
                      onClick={() => setCoin(item)}
                    >
                      {brand ? <CryptoBrandIcon id={brand} className="cp-funds-coin-mark" /> : <span className="cp-funds-coin-fallback">{item.slice(0, 1)}</span>}
                      <span>{item.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>

              <div className="cp-funds-amount-block">
                <label className="cp-field">
                  <span>Amount (USD)</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="25.00"
                  />
                </label>
                <div className="cp-funds-presets" aria-label="Quick amounts">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={Number(amount) === preset ? "is-on" : ""}
                      onClick={() => setAmount(String(preset))}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {error ? <p className="cp-error">{error}</p> : null}

              <button className="cp-btn cp-funds-submit" type="button" disabled={busy || !coin} onClick={() => void createInvoice()}>
                {busy ? "Creating invoice…" : "Generate crypto invoice"}
              </button>
            </>
          )}
        </section>

        <aside className="cp-card cp-glass-panel cp-funds-aside">
          <h3>How Banker credits work</h3>
          <ol className="cp-funds-steps">
            <li>
              <strong>Invoice</strong>
              <span>Fixed crypto amount and deposit address</span>
            </li>
            <li>
              <strong>Pay</strong>
              <span>Send from your wallet before expiry</span>
            </li>
            <li>
              <strong>Confirm</strong>
              <span>Gateway webhook verifies the chain</span>
            </li>
            <li>
              <strong>Credit</strong>
              <span>USD balance updates automatically</span>
            </li>
          </ol>
          <p className="cp-note">Crypto only · no card or bank transfer on this panel.</p>
          <Link className="cp-btn-ghost cp-funds-link" href="/dashboard/transactions">
            Ledger &amp; transactions
          </Link>
        </aside>
      </div>

      {live && payment ? (
        <section className="cp-card cp-glass-panel cp-funds-invoice">
          <header className="cp-funds-invoice-head">
            <div>
              <p className="cp-kicker">Active deposit</p>
              <h3>Invoice {payment.id}</h3>
            </div>
            <span className={`cp-funds-status cp-funds-status--${statusTone(payment.status)}`}>
              {LABELS[payment.status] || payment.status}
            </span>
          </header>

          <div className="cp-funds-invoice-grid">
            <div>
              <span className="cp-label">You pay</span>
              <p className="cp-funds-invoice-value">
                {payment.payAmount || "—"} {payment.payCurrency?.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="cp-label">Credited (USD)</span>
              <p className="cp-funds-invoice-value">${payment.amountUsd.toFixed(2)}</p>
            </div>
            {payment.expiresAt ? (
              <div>
                <span className="cp-label">Expires</span>
                <p className="cp-funds-invoice-value">{new Date(payment.expiresAt).toLocaleString()}</p>
              </div>
            ) : null}
          </div>

          {payment.address ? (
            <div className="cp-funds-address">
              <span className="cp-label">Deposit address</span>
              <div className="cp-funds-address-row">
                <code>{payment.address}</code>
                <button
                  type="button"
                  className="cp-btn-ghost cp-funds-copy"
                  onClick={() => void navigator.clipboard.writeText(payment.address || "")}
                >
                  Copy
                </button>
              </div>
            </div>
          ) : null}

          {payment.payUrl ? (
            <p>
              <a className="cp-btn cp-funds-open" href={payment.payUrl} target="_blank" rel="noopener noreferrer">
                Open secure payment page
              </a>
            </p>
          ) : null}

          <label className="cp-field">
            <span>Transaction hash (optional — does not credit by itself)</span>
            <input value={hash} onChange={(e) => setHash(e.target.value)} placeholder="0x… or chain tx id" />
          </label>
          <button className="cp-btn-ghost" type="button" onClick={() => void submitHash()}>
            Submit hash for tracking
          </button>
          {note ? <p className="cp-ok">{note}</p> : null}
        </section>
      ) : null}
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
  if (rows.length === 0)
    return (
      <section className="cp-card">
        <Empty
          title="No payment history"
          copy="Confirmed and pending crypto deposits will be listed here."
          href="/dashboard/add-funds"
          cta="Add funds"
        />
      </section>
    );
  return (
    <section className="cp-card cp-table-wrap">
      <table className="cp-table">
        <thead>
          <tr>
            <th>Deposit</th>
            <th>Currency</th>
            <th>Amount</th>
            <th>Hash</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
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
  const [rows, setRows] = useState<
    { id: string; type: string; description: string; amount: number; balanceAfter: number; status: string; date: string }[] | null
  >(null);
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
      {!rows ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <Empty title="No transactions" copy="Wallet deposits and order charges are recorded here." />
      ) : (
        <table className="cp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Balance after</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
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