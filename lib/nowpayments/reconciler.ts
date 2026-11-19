import { listAllInvoices } from "@/lib/smm-api/demo-store";
import { syncNowPaymentsInvoice } from "@/lib/banker/handler";
import { loadNowPaymentsConfig } from "@/lib/nowpayments/config";

const INTERVAL_MS = 30_000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const BATCH = 6;

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

/**
 * Safety net behind the signed IPN.
 *
 * A customer who closes the tab, and a webhook that never arrives, must not leave a finished
 * payment uncredited. Every open NOWPayments deposit is re-checked against the provider with
 * the server API key and passed through the same credit policy as the webhook. Credits are
 * idempotent, so a duplicate check can never add the money twice.
 */
async function sweep() {
  if (running) return;
  const cfg = loadNowPaymentsConfig();
  if (!cfg.live) return;
  running = true;
  try {
    const now = Date.now();
    const open = (await listAllInvoices())
      .filter((invoice) => {
        if (invoice.provider !== "nowpayments" || !invoice.nowPaymentId) return false;
        if (invoice.walletCredited || invoice.status === "paid") return false;
        if (invoice.status === "failed" || invoice.status === "expired") return false;
        const created = Date.parse(invoice.createdAt);
        return Number.isFinite(created) && now - created < MAX_AGE_MS;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      .slice(0, BATCH);

    for (const invoice of open) {
      await syncNowPaymentsInvoice(invoice.id).catch(() => undefined);
    }
  } catch {
    /* the next tick retries */
  } finally {
    running = false;
  }
}

export function startDepositReconciler() {
  if (timer) return;
  timer = setInterval(() => void sweep(), INTERVAL_MS);
  timer.unref?.();
  setTimeout(() => void sweep(), 8_000).unref?.();
}

/**
 * Starts the sweep from a server route the first time a deposit page is touched. The timer
 * lives for the life of the process, so a customer who closes the tab is still covered by
 * later visits and by every deploy restart.
 */
export function ensureDepositReconciler() {
  if (typeof window !== "undefined") return;
  startDepositReconciler();
}
