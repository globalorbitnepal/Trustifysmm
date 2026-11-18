"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CoinLogo } from "@/components/dashboard/CoinLogo";
import { CryptoDepositQr } from "@/components/dashboard/CryptoDepositQr";
import { Empty, Skeleton } from "@/components/dashboard/OverviewView";
import { networkLabel } from "@/lib/nowpayments/network-labels";

type DepositOption = {
  code: string;
  name: string;
  symbol: string;
  network: string;
  networkLabel: string;
  popular: boolean;
};

type CurrenciesResponse = {
  live: boolean;
  currencies: string[];
  minDepositUsd?: number;
  maxDepositUsd?: number;
  sandbox?: boolean;
  options?: DepositOption[];
  providerVerified?: boolean;
  error?: string | null;
};

type Payment = {
  id: string;
  amountUsd: number;
  payCurrency: string | null;
  payAmount: string | null;
  address: string | null;
  payUrl: string | null;
  txHash: string | null;
  status: string;
  providerStatus?: string | null;
  nowPaymentId?: string | null;
  network?: string | null;
  /** Network label captured when the invoice was created. Never read from live picker state. */
  networkLabel?: string | null;
  createdAt: string;
  expiresAt: string | null;
};

const PRESETS = [10, 25, 50, 100, 250] as const;

const LABELS: Record<string, string> = {
  pending: "Waiting for payment",
  confirming: "Confirming on blockchain",
  paid: "Payment successful",
  partial: "Partially paid — under review",
  expired: "Expired",
  failed: "Failed",
  review: "Manual review required",
};

function statusTone(status: string): string {
  if (status === "paid") return "ok";
  if (status === "confirming" || status === "partial" || status === "review") return "warn";
  if (status === "pending") return "pending";
  return "dim";
}

function isTerminal(status: string) {
  return status === "paid" || status === "expired" || status === "failed";
}

export function AddFundsView() {
  const [balance, setBalance] = useState(0);
  const [gateway, setGateway] = useState<CurrenciesResponse | null>(null);
  const [options, setOptions] = useState<DepositOption[]>([]);
  const [coin, setCoin] = useState("");
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("25");
  const [quote, setQuote] = useState<{ crypto: string; at: number } | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [polling, setPolling] = useState(false);

  const minDeposit = gateway?.minDepositUsd ?? 1;
  const maxDeposit = gateway?.maxDepositUsd ?? 50_000;

  useEffect(() => {
    void (async () => {
      const [paymentsRes, currencyRes] = await Promise.all([
        fetch("/api/dashboard/payments"),
        fetch("/api/payments/nowpayments/currencies"),
      ]);
      if (paymentsRes.ok) {
        const data = (await paymentsRes.json()) as { balance: number };
        setBalance(data.balance);
      }
      if (currencyRes.ok) {
        const data = (await currencyRes.json()) as CurrenciesResponse;
        setGateway(data);
        setOptions(data.options ?? []);
        setCoin((prev) => prev || data.options?.[0]?.code || "");
      } else {
        setGateway({ live: false, currencies: [] });
      }
      setReady(true);
    })();
  }, []);

  const selected = useMemo(() => options.find((row) => row.code === coin) ?? null, [options, coin]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((row) =>
      [row.code, row.symbol, row.name, row.network, row.networkLabel].join(" ").toLowerCase().includes(needle),
    );
  }, [options, query]);

  const popular = filtered.filter((row) => row.popular);
  const others = filtered.filter((row) => !row.popular);

  const amountNumber = Number(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber >= minDeposit && amountNumber <= maxDeposit;

  useEffect(() => {
    setQuote(null);
    if (!selected || !amountValid) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setQuoting(true);
      void fetch(`/api/payments/nowpayments/estimate?currency=${encodeURIComponent(selected.code)}&amount=${amountNumber}`)
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as { estimatedCrypto?: string };
          if (!cancelled && data.estimatedCrypto) {
            setQuote({ crypto: data.estimatedCrypto, at: Date.now() });
          }
        })
        .finally(() => {
          if (!cancelled) setQuoting(false);
        });
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selected, amountNumber, amountValid]);

  const refreshStatus = useCallback(async (depositId: string, silent = false) => {
    if (!silent) setPolling(true);
    const res = await fetch(`/api/payments/nowpayments/status/${encodeURIComponent(depositId)}`);
    if (res.ok) {
      const row = (await res.json()) as {
        status: string;
        provider_status?: string | null;
        network?: string | null;
        pay_address?: string | null;
        pay_amount?: string | null;
        wallet_credited?: boolean;
      };
      setPayment((prev) =>
        prev && prev.id === depositId
          ? {
              ...prev,
              status: row.status,
              providerStatus: row.provider_status ?? prev.providerStatus,
              address: row.pay_address ?? prev.address,
              payAmount: row.pay_amount ?? prev.payAmount,
              network: row.network ?? prev.network,
              networkLabel: row.network ? networkLabel(row.network) : prev.networkLabel,
            }
          : prev,
      );
      if (row.status === "paid") {
        const bal = await fetch("/api/dashboard/payments");
        if (bal.ok) {
          const data = (await bal.json()) as { balance: number };
          setBalance(data.balance);
        }
      }
    }
    if (!silent) setPolling(false);
  }, []);

  useEffect(() => {
    if (!payment || isTerminal(payment.status)) return;
    const id = payment.id;
    const timer = window.setInterval(() => void refreshStatus(id, true), 10_000);
    return () => window.clearInterval(timer);
  }, [payment, refreshStatus]);

  async function createInvoice() {
    setError("");
    if (!selected) {
      setError("Choose a coin and network first.");
      return;
    }
    if (!amountValid) {
      setError(`Enter a USD amount between $${minDeposit} and $${maxDeposit}.`);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/payments/nowpayments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountNumber, payCurrency: selected.code }),
    });
    const data = (await res.json()) as {
      error?: string;
      deposit_id?: string;
      invoice_id?: string;
      pay_address?: string | null;
      pay_amount?: string | null;
      pay_currency?: string | null;
      payment_url?: string | null;
      expires_at?: string | null;
      status?: string;
      provider_status?: string;
      nowpayments_payment_id?: string | null;
      network?: string | null;
    };
    setBusy(false);
    if (!res.ok || !(data.deposit_id || data.invoice_id)) {
      setError(data.error || "Deposit could not be created.");
      return;
    }
    setPayment({
      id: (data.deposit_id || data.invoice_id) as string,
      amountUsd: amountNumber,
      payCurrency: data.pay_currency ?? selected.code,
      payAmount: data.pay_amount ?? null,
      address: data.pay_address ?? null,
      payUrl: data.payment_url ?? null,
      txHash: null,
      status: data.status || "pending",
      providerStatus: data.provider_status ?? "waiting",
      nowPaymentId: data.nowpayments_payment_id ?? null,
      network: data.network ?? selected.network,
      networkLabel: data.network ? networkLabel(data.network) : selected.networkLabel,
      createdAt: new Date().toISOString(),
      expiresAt: data.expires_at ?? null,
    });
    setNote("");
    setHash("");
    setCopied("");
  }

  async function copyValue(value: string, label: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setError("Copy failed — select the value manually.");
    }
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

  const live = Boolean(gateway?.live && options.length);

  return (
    <div className="cp-funds cp-deposit">
      <section className="cp-card cp-deposit-head">
        <div>
          <p className="cp-kicker">Banker · crypto wallet</p>
          <h2 className="cp-deposit-title">Add funds</h2>
          <p className="cp-deposit-balance">
            Available balance <strong>${balance.toFixed(2)}</strong> <span>USD</span>
          </p>
        </div>
        <div className="cp-deposit-head-side">
          <span className={`cp-deposit-pill${live ? " is-live" : " is-off"}`}>
            {live ? "Provider online" : "Provider unavailable"}
          </span>
          <span className="cp-deposit-pill is-muted">Secure crypto payments · NOWPayments</span>
        </div>
      </section>

      <div className="cp-deposit-grid">
        <section className="cp-card cp-deposit-panel">
          {!live ? (
            <div className="cp-funds-offline">
              <h3>Crypto deposits are unavailable</h3>
              <p>
                {gateway?.error ||
                  "The payment provider is not configured or returned no enabled currencies. No balance is added without provider confirmation."}
              </p>
              <ul className="cp-funds-trust">
                <li>Funds credit only after provider verification</li>
                <li>Manual screenshots never add balance</li>
                <li>Full audit trail in Payment History</li>
              </ul>
              <Link className="cp-btn-ghost" href="/dashboard/payments">
                View payment history
              </Link>
            </div>
          ) : (
            <>
              <header className="cp-deposit-step">
                <span>1</span>
                <div>
                  <h3>Choose coin &amp; network</h3>
                  <p>Each network is a separate payment currency. Sending on the wrong network can lose funds.</p>
                </div>
              </header>

              <label className="cp-deposit-search">
                <SearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search coin, symbol, or network…"
                  autoComplete="off"
                />
              </label>

              {filtered.length === 0 ? (
                <p className="cp-deposit-empty">No currency matches “{query}”. Try the symbol or network name.</p>
              ) : (
                <>
                  {popular.length ? (
                    <div className="cp-deposit-group">
                      <p className="cp-deposit-group-label">Popular</p>
                      <div className="cp-coin-grid">
                        {popular.map((row) => (
                          <CoinButton key={row.code} row={row} active={row.code === coin} onSelect={() => setCoin(row.code)} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {others.length ? (
                    <div className="cp-deposit-group">
                      <p className="cp-deposit-group-label">{query ? "Matching currencies" : "All supported currencies"}</p>
                      <div className="cp-coin-grid">
                        {others.map((row) => (
                          <CoinButton key={row.code} row={row} active={row.code === coin} onSelect={() => setCoin(row.code)} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {selected ? (
                <div className="cp-deposit-selected">
                  <CoinLogo code={selected.code} size={44} />
                  <div>
                    <strong>
                      {selected.symbol} <span>· {selected.networkLabel}</span>
                    </strong>
                    <small>
                      Provider currency <code>{selected.code}</code>
                    </small>
                  </div>
                </div>
              ) : null}

              <header className="cp-deposit-step">
                <span>2</span>
                <div>
                  <h3>Enter amount</h3>
                  <p>
                    Minimum ${minDeposit.toFixed(2)} · Maximum ${maxDeposit.toLocaleString()} per deposit
                  </p>
                </div>
              </header>

              <label className="cp-deposit-amount">
                <span>$</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="25.00"
                  aria-label="Deposit amount in USD"
                />
                <em>USD</em>
              </label>

              <div className="cp-deposit-presets">
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

              {!amountValid && amount !== "" ? (
                <p className="cp-error">Enter a USD amount between ${minDeposit} and ${maxDeposit}.</p>
              ) : null}

              <dl className="cp-deposit-summary">
                <div>
                  <dt>You pay</dt>
                  <dd>${Number.isFinite(amountNumber) ? amountNumber.toFixed(2) : "0.00"} USD</dd>
                </div>
                <div>
                  <dt>Estimated crypto</dt>
                  <dd>
                    {quoting
                      ? "Quoting…"
                      : quote
                        ? `${trimCrypto(quote.crypto)} ${selected?.symbol ?? ""}`
                        : "Enter a valid amount"}
                  </dd>
                </div>
                <div>
                  <dt>Network</dt>
                  <dd>{selected?.networkLabel ?? "—"}</dd>
                </div>
                <div>
                  <dt>Fees</dt>
                  <dd>Network fee paid to the blockchain</dd>
                </div>
              </dl>
              <p className="cp-deposit-note">
                Estimates use the provider quote and can change until the payment is created.
              </p>

              {error ? <p className="cp-error">{error}</p> : null}

              <button
                className="cp-btn cp-deposit-submit"
                type="button"
                disabled={busy || !selected || !amountValid}
                onClick={() => void createInvoice()}
              >
                {busy ? "Creating payment…" : "Continue to crypto checkout"}
              </button>
            </>
          )}
        </section>

        <aside className="cp-card cp-deposit-aside">
          <h3>How crediting works</h3>
          <ol className="cp-funds-steps">
            <li>
              <strong>Invoice</strong>
              <span>Fixed crypto amount and deposit address</span>
            </li>
            <li>
              <strong>Pay</strong>
              <span>Send on the stated network before expiry</span>
            </li>
            <li>
              <strong>Verify</strong>
              <span>Signed provider webhook checks amount and network</span>
            </li>
            <li>
              <strong>Credit</strong>
              <span>USD balance updates only after verification</span>
            </li>
          </ol>
          <p className="cp-note">Crypto only. Underpaid or mismatched payments go to manual review.</p>
          <Link className="cp-btn-ghost cp-funds-link" href="/dashboard/payments">
            Payment history
          </Link>
        </aside>
      </div>

      {live && payment ? (
        <section className="cp-card cp-deposit-checkout" aria-live="polite">
          <header className="cp-deposit-checkout-head">
            <div>
              <p className="cp-kicker">Deposit {payment.id}</p>
              <h3>{LABELS[payment.status] || payment.status}</h3>
            </div>
            <span className={`cp-deposit-status cp-deposit-status--${statusTone(payment.status)}`}>
              {payment.providerStatus ? payment.providerStatus.replace(/_/g, " ") : payment.status}
            </span>
          </header>

          {payment.status === "paid" ? (
            <div className="cp-deposit-success">
              <CheckIcon />
              <div>
                <strong>Payment verified — wallet credited</strong>
                <p>
                  ${payment.amountUsd.toFixed(2)} was added to your balance.
                  {payment.nowPaymentId ? ` Provider ref ${payment.nowPaymentId}.` : ""}
                </p>
              </div>
              <Link className="cp-btn" href="/dashboard">
                Back to dashboard
              </Link>
            </div>
          ) : null}

          <div className="cp-deposit-checkout-grid">
            <div>
              <span className="cp-label">You send</span>
              <p className="cp-deposit-big">
                {payment.payAmount || "—"} {payment.payCurrency?.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="cp-label">Credited (USD)</span>
              <p className="cp-deposit-big">${payment.amountUsd.toFixed(2)}</p>
            </div>
            <div>
              <span className="cp-label">Network</span>
              <p className="cp-deposit-big">{payment.networkLabel || payment.network || "—"}</p>
            </div>
            {payment.expiresAt ? (
              <div>
                <span className="cp-label">Expires</span>
                <p className="cp-deposit-big">{new Date(payment.expiresAt).toLocaleString()}</p>
              </div>
            ) : null}
          </div>

          {payment.address ? (
            <>
              <CryptoDepositQr value={payment.address} label="Scan with your wallet" />
              <div className="cp-deposit-copy">
                <span className="cp-label">Deposit address</span>
                <div>
                  <code>{payment.address}</code>
                  <button type="button" className="cp-btn-ghost" onClick={() => void copyValue(payment.address || "", "address")}>
                    {copied === "address" ? "Copied" : "Copy address"}
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {payment.payAmount ? (
            <div className="cp-deposit-copy">
              <span className="cp-label">Exact amount</span>
              <div>
                <code>
                  {payment.payAmount} {payment.payCurrency?.toUpperCase()}
                </code>
                <button type="button" className="cp-btn-ghost" onClick={() => void copyValue(payment.payAmount || "", "amount")}>
                  {copied === "amount" ? "Copied" : "Copy amount"}
                </button>
              </div>
            </div>
          ) : null}

          {payment.nowPaymentId ? (
            <div className="cp-deposit-copy">
              <span className="cp-label">Provider payment ID</span>
              <div>
                <code>{payment.nowPaymentId}</code>
                <button type="button" className="cp-btn-ghost" onClick={() => void copyValue(payment.nowPaymentId || "", "payment")}>
                  {copied === "payment" ? "Copied" : "Copy ID"}
                </button>
              </div>
            </div>
          ) : null}

          <p className="cp-deposit-warning">
            Send only {payment.payCurrency?.toUpperCase()} through {payment.networkLabel || payment.network}. Sending another asset or
            network may result in permanent loss of funds.
          </p>

          <div className="cp-deposit-checkout-actions">
            {payment.payUrl ? (
              <a className="cp-btn" href={payment.payUrl} target="_blank" rel="noopener noreferrer">
                Open provider checkout
              </a>
            ) : null}
            <button
              type="button"
              className="cp-btn-ghost"
              disabled={polling || isTerminal(payment.status)}
              onClick={() => void refreshStatus(payment.id)}
            >
              {polling ? "Checking…" : "Refresh status"}
            </button>
            {isTerminal(payment.status) ? (
              <button type="button" className="cp-btn" onClick={() => setPayment(null)}>
                Create another deposit
              </button>
            ) : null}
          </div>

          {payment.status !== "paid" ? (
            <>
              <label className="cp-field">
                <span>Transaction hash (optional — does not credit by itself)</span>
                <input value={hash} onChange={(event) => setHash(event.target.value)} placeholder="0x… or chain tx id" />
              </label>
              <button className="cp-btn-ghost" type="button" onClick={() => void submitHash()}>
                Submit hash for tracking
              </button>
              {note ? <p className="cp-ok">{note}</p> : null}
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function CoinButton({ row, active, onSelect }: { row: DepositOption; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`cp-coin${active ? " is-on" : ""}`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <CoinLogo code={row.code} size={38} />
      <span className="cp-coin-copy">
        <strong>{row.symbol}</strong>
        <small>{row.networkLabel}</small>
      </span>
      {active ? <span className="cp-coin-check" aria-hidden>✓</span> : null}
    </button>
  );
}

function trimCrypto(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n >= 1) return n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return n.toPrecision(6).replace(/0+$/, "").replace(/\.$/, "");
}

type HistoryPayment = Payment & { walletCredited?: boolean; providerStatus?: string | null };

const HISTORY_FILTERS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["confirming", "Confirming"],
  ["paid", "Credited"],
  ["review", "Manual review"],
  ["failed", "Failed"],
  ["expired", "Expired"],
] as const;

export function PaymentsView() {
  const [rows, setRows] = useState<HistoryPayment[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<HistoryPayment | null>(null);

  useEffect(() => {
    void fetch("/api/dashboard/payments").then(async (res) => {
      if (res.ok) setRows(((await res.json()) as { payments: HistoryPayment[] }).payments);
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

  const needle = q.trim().toLowerCase();
  const visible = rows.filter((row) => {
    const statusMatch =
      filter === "all" ||
      (filter === "pending" && (row.status === "pending" || row.status === "confirming")) ||
      (filter === "confirming" && row.status === "confirming") ||
      (filter === "paid" && row.status === "paid") ||
      (filter === "review" && (row.status === "review" || row.status === "partial")) ||
      row.status === filter;
    const haystack = `${row.id} ${row.payCurrency ?? ""} ${row.network ?? ""} ${row.nowPaymentId ?? ""}`.toLowerCase();
    return statusMatch && (!needle || haystack.includes(needle));
  });

  return (
    <div className="cp-history">
      <div className="cp-row-actions">
        <input placeholder="Search deposit, coin, network" value={q} onChange={(event) => setQ(event.target.value)} />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Status">
          {HISTORY_FILTERS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <section className="cp-card cp-table-wrap">
        <table className="cp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Deposit</th>
              <th>USD</th>
              <th>Coin</th>
              <th>Network</th>
              <th>Status</th>
              <th>Credited</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td data-label="Date">{row.createdAt.slice(0, 16).replace("T", " ")}</td>
                <td data-label="Deposit">{row.id}</td>
                <td data-label="USD">${row.amountUsd.toFixed(2)}</td>
                <td data-label="Coin">{row.payCurrency?.toUpperCase() || "—"}</td>
                <td data-label="Network">{row.network ? networkLabel(row.network) : "—"}</td>
                <td data-label="Status">{LABELS[row.status] || row.status}</td>
                <td data-label="Credited">{row.status === "paid" ? "Yes" : "No"}</td>
                <td>
                  <button type="button" className="cp-btn-ghost" onClick={() => setDetail(row)}>
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8}>No deposits match this filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {detail ? (
        <div className="cp-deposit-modal" role="dialog" aria-modal="true" aria-labelledby="cp-receipt-title">
          <div className="cp-deposit-modal-card">
            <header>
              <h3 id="cp-receipt-title">Deposit receipt</h3>
              <button type="button" className="cp-btn-ghost" onClick={() => setDetail(null)}>
                Close
              </button>
            </header>
            <dl className="cp-deposit-receipt">
              <div>
                <dt>Deposit ID</dt>
                <dd>{detail.id}</dd>
              </div>
              <div>
                <dt>USD amount</dt>
                <dd>${detail.amountUsd.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Coin &amp; network</dt>
                <dd>
                  {detail.payCurrency?.toUpperCase() || "—"} {detail.network ? `· ${networkLabel(detail.network)}` : ""}
                </dd>
              </div>
              <div>
                <dt>Crypto amount</dt>
                <dd>{detail.payAmount || "—"}</dd>
              </div>
              <div>
                <dt>Provider payment ID</dt>
                <dd>{detail.nowPaymentId || "—"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{(detail.providerStatus || detail.status).replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt>Wallet credit</dt>
                <dd>{detail.status === "paid" ? "Credited" : "Not credited"}</dd>
              </div>
              <div>
                <dt>Deposit address</dt>
                <dd>
                  <code>{detail.address || "—"}</code>
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(detail.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Transaction hash</dt>
                <dd>{detail.txHash || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.16" />
      <path d="m7.5 12.2 3.1 3.1 6-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}