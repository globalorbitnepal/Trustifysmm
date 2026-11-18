"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CoinLogo } from "@/components/dashboard/CoinLogo";
import { CryptoDepositQr } from "@/components/dashboard/CryptoDepositQr";
import { Empty, Skeleton } from "@/components/dashboard/OverviewView";
import { openDepositInvoice } from "@/components/dashboard/deposit-invoice";
import { networkBadge, networkLabel } from "@/lib/nowpayments/network-labels";

type DepositOption = {
  code: string;
  name: string;
  symbol: string;
  network: string;
  networkLabel: string;
  logoUrl?: string | null;
  minUsd?: number | null;
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
  paidAt?: string | null;
  expiresAt: string | null;
  quoteCrypto?: string | null;
  baseCrypto?: string | null;
  feeUsd?: number | null;
  symbol?: string | null;
  logoUrl?: string | null;
};

const PRESETS = [10, 20, 25, 50, 100, 250, 500, 1000] as const;
const PAYMENT_WINDOW_MS = 60 * 60 * 1000;
const STATUS_POLL_MS = 30_000;

const LABELS: Record<string, string> = {
  pending: "Waiting for payment",
  confirming: "Confirming on blockchain",
  paid: "Payment successful",
  partial: "Partially paid — under review",
  expired: "Timed out",
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
  const [amount, setAmount] = useState("10");
  const [quote, setQuote] = useState<{ crypto: string; base: string | null; feeUsd: number | null; at: number } | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payer, setPayer] = useState<{ name: string | null; email: string | null } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const minDeposit = gateway?.minDepositUsd ?? 5;
  const maxDeposit = gateway?.maxDepositUsd ?? 1_000;

  useEffect(() => {
    void (async () => {
      const [paymentsRes, currencyRes] = await Promise.all([
        fetch("/api/dashboard/payments"),
        fetch("/api/payments/nowpayments/currencies"),
      ]);
      if (paymentsRes.ok) {
        const data = (await paymentsRes.json()) as {
          balance: number;
          customer?: { name: string | null; email: string | null };
        };
        setBalance(data.balance);
        if (data.customer) setPayer(data.customer);
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

  const coinGroups = useMemo(() => {
    const groups: { symbol: string; rows: DepositOption[] }[] = [];
    for (const row of filtered) {
      const existing = groups.find((group) => group.symbol === row.symbol);
      if (existing) existing.rows.push(row);
      else groups.push({ symbol: row.symbol, rows: [row] });
    }
    return groups;
  }, [filtered]);

  const providerMin = selected?.minUsd ?? null;
  const effectiveMin = Math.max(minDeposit, providerMin ?? minDeposit);
  const amountNumber = Number(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber >= effectiveMin && amountNumber <= maxDeposit;

  useEffect(() => {
    setQuote(null);
    if (!selected || !amountValid) return;
    const currency = selected.code;
    let cancelled = false;
    async function loadQuote() {
      setQuoting(true);
      try {
        const res = await fetch(
          `/api/payments/nowpayments/estimate?currency=${encodeURIComponent(currency)}&amount=${amountNumber}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { estimatedCrypto?: string; baseCrypto?: string | null; feeUsd?: number | null };
        if (!cancelled && data.estimatedCrypto) {
          setQuote({
            crypto: data.estimatedCrypto,
            base: data.baseCrypto ?? null,
            feeUsd: typeof data.feeUsd === "number" ? data.feeUsd : null,
            at: Date.now(),
          });
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }
    const timer = window.setTimeout(() => void loadQuote(), 400);
    const refresh = window.setInterval(() => void loadQuote(), STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(refresh);
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
    if (!checkoutOpen) return;
    setNowTick(Date.now());
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [checkoutOpen]);

  useEffect(() => {
    if (!payment || isTerminal(payment.status)) return;
    const id = payment.id;
    const timer = window.setInterval(() => void refreshStatus(id, true), STATUS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [payment, refreshStatus]);

  async function createInvoice() {
    setError("");
    if (!selected) {
      setError("Choose a coin and network first.");
      return;
    }
    if (!amountValid) {
      setError("Choose $10, $20, $25, $50, or $100.");
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
      quoteCrypto: quote?.crypto ?? null,
      baseCrypto: quote?.base ?? null,
      feeUsd: quote?.feeUsd ?? null,
      symbol: selected.symbol,
      logoUrl: selected.logoUrl,
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
    setCheckoutOpen(true);
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
  const activeGroup = coinGroups.find((group) => group.rows.some((row) => row.code === coin)) ?? null;
  const step = payment?.status === "paid" ? 4 : checkoutOpen ? 3 : selected ? 2 : 1;
  const quoteLabel = quoting ? "Quoting…" : quote ? `${trimCrypto(quote.crypto)} ${selected?.symbol ?? ""}` : "—";

  return (
    <div className="cp-funds cp-deposit cp-banker">
      <header className="cp-banker-head">
        <div className="cp-banker-mark" aria-hidden>
          <WalletGlyph />
        </div>
        <div>
          <h2 className="cp-deposit-title">Add funds</h2>
          <p className="cp-banker-lede">Top up your wallet with cryptocurrency. Balance ${balance.toFixed(2)} USD.</p>
        </div>
        <span className={`cp-deposit-pill${live ? " is-live" : " is-off"}`}>{live ? "Provider online" : "Provider unavailable"}</span>
      </header>

      <ol className="cp-banker-steps">
        {[
          [1, "Select amount"],
          [2, "Choose crypto"],
          [3, "Payment"],
          [4, "Complete"],
        ].map(([id, label], index, rows) => (
          <li key={id} className={step >= Number(id) ? "is-on" : ""}>
            <span>{step > Number(id) ? "✓" : id}</span>
            <em>{label}</em>
            {index < rows.length - 1 ? <i /> : null}
          </li>
        ))}
      </ol>

      {!live ? (
        <section className="cp-card cp-glass cp-funds-offline">
          <h3>Crypto deposits are unavailable</h3>
          <p>
            {gateway?.error ||
              "The payment provider is not configured or returned no enabled currencies. No balance is added without provider confirmation."}
          </p>
          <Link className="cp-btn-ghost" href="/dashboard/payments">
            View payment history
          </Link>
        </section>
      ) : (
        <div className="cp-banker-grid">
          <div className="cp-banker-main">
            <section className="cp-card cp-glass cp-banker-card">
              <h3><span>1</span> Enter amount (USD)</h3>
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
                <p className="cp-error">
                  {amountNumber > maxDeposit
                    ? `The highest top-up is $${maxDeposit.toLocaleString()}.`
                    : "Choose $10, $20, $25, $50, $100, $250, $500, or $1000."}
                </p>
              ) : null}
            </section>

            <section className="cp-card cp-glass cp-banker-card">
              <h3><span>2</span> Select cryptocurrency</h3>
              <label className="cp-deposit-search">
                <SearchIcon />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search coin or network"
                  autoComplete="off"
                />
              </label>
              {coinGroups.length === 0 ? (
                <p className="cp-deposit-empty">No currency matches “{query}”.</p>
              ) : (
                <div className="cp-asset-grid">
                  {coinGroups.map((group) => {
                    const current = group.rows.find((row) => row.code === coin) ?? group.rows[0];
                    const active = group.rows.some((row) => row.code === coin);
                    return (
                      <button
                        key={group.symbol}
                        type="button"
                        className={`cp-asset${active ? " is-on" : ""}`}
                        aria-pressed={active}
                        onClick={() => setCoin(current.code)}
                      >
                        <CoinLogo code={current.code} logoUrl={current.logoUrl} size={42} />
                        <strong>{group.symbol}</strong>
                        <small>{shortCoinName(group.symbol, current.name)}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {activeGroup ? (
              <section className="cp-card cp-glass cp-banker-card">
                <h3><span>3</span> Select network ({activeGroup.symbol})</h3>
                <div className="cp-network-grid">
                  {activeGroup.rows.map((row) => (
                    <button
                      key={row.code}
                      type="button"
                      className={`cp-network${row.code === coin ? " is-on" : ""}`}
                      aria-pressed={row.code === coin}
                      onClick={() => setCoin(row.code)}
                    >
                      <CoinLogo code={row.code} logoUrl={row.logoUrl} size={28} />
                      <span>
                        <strong>{networkBadge(row.code, row.network)}</strong>
                        <small>{row.networkLabel}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="cp-card cp-glass cp-banker-summary">
            <h3>Payment summary</h3>
            <dl>
              <div>
                <dt>Amount</dt>
                <dd>${Number.isFinite(amountNumber) ? amountNumber.toFixed(2) : "0.00"}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>{selected ? networkBadge(selected.code, selected.network) : "—"}</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd className="cp-fee-plus">{quoting ? "…" : quote?.feeUsd != null ? `+ $${quote.feeUsd.toFixed(2)}` : "—"}</dd>
              </div>
            </dl>
            <div className="cp-send-block">
              <span>You send</span>
              <strong>{quoteLabel}</strong>
            </div>
            <p className="cp-deposit-note">
              Wallet credit ${Number.isFinite(amountNumber) ? amountNumber.toFixed(2) : "0.00"}. Provider fee is already inside this crypto amount.
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
            <p className="cp-banker-secure">Secured by NOWPayments · Provider window, capped at 1 hour</p>
            <Link className="cp-btn-ghost cp-funds-link" href="/dashboard/payments">
              Payment history
            </Link>
          </aside>
        </div>
      )}

      {live && payment && !checkoutOpen ? (
        <button type="button" className="cp-btn cp-deposit-resume" onClick={() => setCheckoutOpen(true)}>
          Open crypto checkout · {payment.id}
        </button>
      ) : null}

      {live && payment && checkoutOpen ? (
        <div className="cp-sheet" role="presentation">
          <section
            className="cp-sheet-card cp-glass cp-deposit-checkout"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crypto-checkout-title"
            aria-live="polite"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="cp-deposit-checkout-head">
              <div>
                <p className="cp-kicker">Crypto checkout</p>
                <h3 id="crypto-checkout-title">{LABELS[payment.status] || payment.status}</h3>
              </div>
              <div className="cp-deposit-head-actions">
                <span className={`cp-deposit-status cp-deposit-status--${statusTone(payment.status)}`}>
                  {payment.providerStatus ? payment.providerStatus.replace(/_/g, " ") : payment.status}
                </span>
                <button type="button" className="cp-deposit-close" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">
                  ×
                </button>
              </div>
            </header>

            {payment.status === "paid" ? (
              <div className="cp-deposit-success">
                <CheckIcon />
                <div>
                  <strong>Payment successful</strong>
                  <p>
                    ${payment.amountUsd.toFixed(2)} was added to your balance.
                    {payment.nowPaymentId ? ` Provider ref ${payment.nowPaymentId}.` : ""}
                  </p>
                </div>
                <button type="button" className="cp-btn" onClick={() => downloadCurrentInvoice(payment, payer)}>
                  Download invoice
                </button>
                <Link className="cp-btn" href="/dashboard">
                  Leave this page
                </Link>
              </div>
            ) : null}

            <div className="cp-sheet-coin">
              <CoinLogo code={payment.payCurrency || ""} logoUrl={payment.logoUrl} size={44} />
              <div>
                <strong>{checkoutTitle(payment)}</strong>
                <small>Pay on {payment.networkLabel || payment.network || "the selected network"}</small>
              </div>
            </div>

            {payment.address ? <CryptoDepositQr value={payment.address} /> : null}

            <p className="cp-send-kicker">You send</p>
            <p className="cp-deposit-exact">
              {payment.payAmount || "—"} <small>{payment.symbol || payment.payCurrency?.toUpperCase()}</small>
            </p>
            <dl className="cp-lock-lines">
              <div>
                <dt>Amount</dt>
                <dd>${payment.amountUsd.toFixed(2)}</dd>
              </div>
              <div>
                <dt>Fee</dt>
                <dd className="cp-fee-plus">{lockedFeeUsd(payment) != null ? `+ $${lockedFeeUsd(payment)!.toFixed(2)}` : "Included"}</dd>
              </div>
            </dl>

            <div className="cp-timer">
              <div>
                <span>Time remaining</span>
                <strong>{formatWindow(payment, nowTick)}</strong>
              </div>
              <i style={{ width: `${windowPercent(payment, nowTick)}%` }} />
            </div>

            <ol className="cp-pay-stages">
              {["Waiting for payment", "Confirming", "Completed"].map((label, index) => (
                <li key={label} className={payStage(payment.status) >= index ? "is-on" : ""}>
                  <span>{payStage(payment.status) > index ? "✓" : index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>

            {payment.address ? (
              <div className="cp-deposit-copy">
                <span className="cp-label">Deposit address</span>
                <div>
                  <code>{payment.address}</code>
                  <button type="button" className="cp-btn-ghost" onClick={() => void copyValue(payment.address || "", "address")}>
                    {copied === "address" ? "Copied" : "Copy address"}
                  </button>
                </div>
              </div>
            ) : null}

            {payment.payAmount ? (
              <div className="cp-deposit-copy">
                <span className="cp-label">Exact crypto amount</span>
                <div>
                  <code>
                    {payment.payAmount} {payment.symbol || payment.payCurrency?.toUpperCase()}
                  </code>
                  <button type="button" className="cp-btn-ghost" onClick={() => void copyValue(payment.payAmount || "", "amount")}>
                    {copied === "amount" ? "Copied" : "Copy amount"}
                  </button>
                </div>
              </div>
            ) : null}

            <p className="cp-deposit-warning">
              Send only {payment.symbol || payment.payCurrency?.toUpperCase()} on {payment.networkLabel || payment.network}. The amount
              includes the provider service fee, which you pay. A different asset or network can be lost. Status refreshes every 30
              seconds and stays in Payment history if you close this window. The payment window is at most 1 hour. A finished
              payment is credited automatically.
            </p>

            <div className="cp-deposit-checkout-actions">
              <button
                type="button"
                className="cp-btn-ghost"
                disabled={polling || isTerminal(payment.status)}
                onClick={() => void refreshStatus(payment.id)}
              >
                {polling ? "Checking…" : "Refresh status"}
              </button>
              {isTerminal(payment.status) ? (
                <button
                  type="button"
                  className="cp-btn"
                  onClick={() => {
                    setPayment(null);
                    setCheckoutOpen(false);
                  }}
                >
                  New deposit
                </button>
              ) : null}
            </div>

            {payment.status !== "paid" ? (
              <details className="cp-deposit-hash">
                <summary>Add a transaction hash for tracking</summary>
                <label className="cp-field">
                  <span>A hash does not credit the wallet by itself</span>
                  <input value={hash} onChange={(event) => setHash(event.target.value)} placeholder="Transaction hash" />
                </label>
                <button className="cp-btn-ghost" type="button" onClick={() => void submitHash()}>
                  Save hash
                </button>
                {note ? <p className="cp-ok">{note}</p> : null}
              </details>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function windowEnd(payment: Payment, now: number) {
  const created = new Date(payment.createdAt).getTime();
  const cap = Number.isFinite(created) ? created + PAYMENT_WINDOW_MS : now + PAYMENT_WINDOW_MS;
  const providerEnd = payment.expiresAt ? new Date(payment.expiresAt).getTime() : cap;
  return Math.min(Number.isFinite(providerEnd) ? providerEnd : cap, cap);
}

function formatWindow(payment: Payment, now: number) {
  const left = windowEnd(payment, now) - now;
  if (left <= 0) return "Ended";
  const total = Math.floor(left / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
}

function windowPercent(payment: Payment, now: number) {
  const created = new Date(payment.createdAt).getTime();
  const end = windowEnd(payment, now);
  const span = Math.max(end - (Number.isFinite(created) ? created : now), 1);
  return Math.max(0, Math.min(100, ((end - now) / span) * 100));
}

function payStage(status: string) {
  if (status === "paid") return 2;
  if (status === "confirming" || status === "partial" || status === "review") return 1;
  return 0;
}

function checkoutTitle(payment: Payment) {
  const symbol = payment.symbol || (payment.payCurrency || "").toUpperCase();
  const badge = networkBadge(payment.payCurrency || "", payment.network);
  if (badge === "TRC20" || badge === "ERC20" || badge === "BEP20") return `${symbol} · ${badge}`;
  return symbol;
}

function downloadCurrentInvoice(
  payment: Payment,
  payer: { name: string | null; email: string | null } | null,
) {
  if (payment.status !== "paid") return;
  openDepositInvoice({
    id: payment.id,
    amountUsd: payment.amountUsd,
    payCurrency: payment.payCurrency,
    payAmount: payment.payAmount,
    address: payment.address,
    network: payment.network,
    networkLabel: payment.networkLabel,
    status: payment.status,
    nowPaymentId: payment.nowPaymentId,
    txHash: payment.txHash,
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,
    customerName: payer?.name,
    customerEmail: payer?.email,
  });
}

function lockedFeeUsd(payment: Payment) {
  const base = Number(payment.baseCrypto);
  const gross = Number(payment.payAmount);
  if (!Number.isFinite(base) || !Number.isFinite(gross) || base <= 0 || gross <= 0) return payment.feeUsd ?? null;
  return Math.max(0, Math.round(payment.amountUsd * (gross / base - 1) * 100) / 100);
}

function shortCoinName(symbol: string, name: string) {
  const known: Record<string, string> = {
    USDT: "Tether",
    USDC: "USD Coin",
    BTC: "Bitcoin",
    ETH: "Ethereum",
    BNB: "BNB",
    SOL: "Solana",
    LTC: "Litecoin",
    TRX: "TRON",
    DASH: "Dash",
    XRP: "XRP",
  };
  return known[symbol] || name.split("(")[0].trim();
}

function WalletGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
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
  ["expired", "Timed out"],
] as const;

const HISTORY_STATUS: Record<string, string> = {
  pending: "Pending",
  confirming: "Confirming",
  paid: "Successful",
  partial: "Partial payment",
  expired: "Timed out",
  failed: "Failed",
  review: "Under review",
};

const OPEN_HISTORY = new Set(["pending", "confirming", "partial", "review"]);

export function PaymentsView() {
  const [rows, setRows] = useState<HistoryPayment[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<HistoryPayment | null>(null);
  const [payer, setPayer] = useState<{ name: string | null; email: string | null } | null>(null);

  useEffect(() => {
    let stop = false;
    async function tick() {
      const res = await fetch("/api/dashboard/payments");
      if (!res.ok || stop) return;
      const data = (await res.json()) as {
        payments: HistoryPayment[];
        customer?: { name: string | null; email: string | null };
      };
      if (data.customer) setPayer(data.customer);
      const open = data.payments.filter((row) => OPEN_HISTORY.has(row.status)).slice(0, 8);
      if (open.length) {
        await Promise.all(open.map((row) => fetch(`/api/payments/nowpayments/status/${encodeURIComponent(row.id)}`)));
        const again = await fetch("/api/dashboard/payments");
        if (!again.ok || stop) return;
        const next = (await again.json()) as { payments: HistoryPayment[] };
        if (stop) return;
        setRows(next.payments);
        setDetail((current) => (current ? next.payments.find((row) => row.id === current.id) ?? current : current));
        return;
      }
      setRows(data.payments);
      setDetail((current) => (current ? data.payments.find((row) => row.id === current.id) ?? current : current));
    }
    void tick();
    const timer = window.setInterval(() => void tick(), STATUS_POLL_MS);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
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
                <td data-label="Status">{HISTORY_STATUS[row.status] || row.status}</td>
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
                <dd>{HISTORY_STATUS[detail.status] || detail.status}</dd>
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
            {detail.status === "paid" ? (
              <button type="button" className="cp-btn" onClick={() => downloadCurrentInvoice(detail, payer)}>
                Download invoice
              </button>
            ) : null}
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