import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { BankerInvoice, DemoAccount, DemoOrder } from "@/lib/smm-api/types";
import { withStoreLock } from "@/lib/runtime-lock";
import {
  demoKeyFromEnv,
  hashApiKey,
  isDenylistedKey,
  isDenylistedKeyHash,
  keyMatchesRecord,
  needsHashMigration,
} from "@/lib/smm-api/api-keys";

export type LedgerEntry = {
  id: string;
  accountKey: string;
  type: "deposit" | "order" | "refund" | "adjustment";
  amount: number;
  balanceAfter: number;
  description: string;
  status: "completed";
  createdAt: string;
  ref?: string;
  adminId?: string;
  reason?: string;
};

type StoreFile = {
  accounts: DemoAccount[];
  orders: DemoOrder[];
  invoices: BankerInvoice[];
  transactions: LedgerEntry[];
  idempotency: { key: string; accountKey: string; orderIds: number[]; createdAt: string }[];
  nextOrderId: number;
};

const STORE_PATH = path.join(process.cwd(), "data", "runtime", "api-store.json");

const defaultStore = (): StoreFile => {
  /*
   * The seeded demo account gets NO usable credential unless DEMO_API_KEY is explicitly
   * configured. There is no hardcoded fallback: an unset env var means the account exists
   * (for balance/ledger isolation) but cannot authenticate at all.
   */
  const demoKey = demoKeyFromEnv();
  return {
    accounts: [
      {
        ...(demoKey ? { keyHash: hashApiKey(demoKey) } : {}),
        email: "demo@trustifysmm.com",
        balance: 100,
        currency: "USD",
        demo: true,
      },
    ],
    orders: [],
    invoices: [],
    transactions: [],
    idempotency: [],
    nextOrderId: 1100,
  };
};

/** Customer-facing order numbers start at 1100 and never reuse a value. */
const FIRST_ORDER_ID = 1100;

async function ensureStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    parsed.transactions ??= [];
    parsed.idempotency ??= [];
    parsed.orders ??= [];
    parsed.invoices ??= [];
    parsed.accounts ??= [];
    /*
     * Older stores started at 900001. Orders are numbered for customers from 1100,
     * so the counter is lowered when no order has been placed yet.
     */
    const highest = parsed.orders.reduce((max, order) => Math.max(max, order.order), 0);
    parsed.nextOrderId = highest >= FIRST_ORDER_ID ? highest + 1 : FIRST_ORDER_ID;
    await quarantineRetiredKeys(parsed);
    return parsed;
  } catch {
    const initial = defaultStore();
    await persist(initial);
    return initial;
  }
}

/**
 * Any account still holding the retired public default key is revoked and its key material
 * removed. Runs on every store load, so a pre-existing production file is cleaned the first
 * time the new code touches it.
 *
 * Only denylisted material is touched — other accounts are left byte-for-byte unchanged.
 * If the operator has configured a fresh `DEMO_API_KEY`, the demo account adopts it and is
 * un-revoked, so the demo wallet stays usable with the *new* key only.
 */
async function quarantineRetiredKeys(store: StoreFile) {
  let changed = false;
  const quarantinedEmails = new Set<string>();

  for (const account of store.accounts) {
    const material = account.keyHash ?? (account.key ? hashApiKey(account.key) : "");
    const retired =
      Boolean(account.key && isDenylistedKey(account.key)) || Boolean(material && isDenylistedKeyHash(material));
    if (!retired) continue;
    account.revoked = true;
    delete account.key;
    account.keyHash = undefined;
    quarantinedEmails.add(account.email.toLowerCase());
    changed = true;
  }

  const configuredDemoKey = demoKeyFromEnv();
  if (configuredDemoKey && quarantinedEmails.size) {
    const demo = store.accounts.find(
      (row) => isDemoAccount(row) && quarantinedEmails.has(row.email.toLowerCase()),
    );
    if (demo) {
      demo.keyHash = hashApiKey(configuredDemoKey);
      demo.revoked = false;
      changed = true;
    }
  }

  if (changed) await persist(store);
}

async function persist(store: StoreFile) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

/**
 * Resolve a wallet from an API key. Accounts store only `keyHash`, so comparing `account.key`
 * directly silently fails on every migrated account. This compares hashes in constant time.
 */
function accountByKey(store: StoreFile, key: string): DemoAccount | null {
  const presented = (key ?? "").trim();
  if (!presented) return null;
  return store.accounts.find((row) => keyMatchesRecord(presented, row)) ?? null;
}

/**
 * Wallet lookup for an admin action.
 *
 * If the wallet record is missing (a customer created before wallets were provisioned, or a
 * key that changed without the wallet following), it is created from the customer record so
 * the screen never reports "Wallet not found" for a real customer. An existing wallet keeps
 * its balance untouched.
 */
export async function ensureAccountForCustomer(input: { email: string; key: string }) {
  const key = (input.key ?? "").trim();
  if (!key) return { error: "This customer has no API key, so a wallet cannot be linked." as const };
  const existing = await getAccountByKey(key);
  if (existing) return { account: existing, created: false as const };
  const account = await ensureDemoAccount({ email: input.email, key, balance: 0 });
  return { account, created: true as const };
}

/** Transparently upgrade a legacy plaintext `key` to `keyHash` on read. */
async function migrateLegacyKey(store: StoreFile, account: DemoAccount) {
  if (!needsHashMigration(account)) return;
  account.keyHash = hashApiKey(account.key as string);
  delete account.key;
  await persist(store);
}

/**
 * Resolve an account by API key using constant-time comparison against the stored hash.
 * The retired public default and its shape are refused outright, even for a store that has
 * not been migrated yet.
 */
export async function getAccountByKey(key: string) {
  const presented = (key ?? "").trim();
  if (!presented) return null;
  if (isDenylistedKey(presented)) return null;

  const store = await ensureStore();
  const account = store.accounts.find((a) => keyMatchesRecord(presented, a)) ?? null;
  if (!account) return null;
  // A revoked credential must never resolve to an account.
  if (account.revoked) return null;
  if (needsHashMigration(account)) await migrateLegacyKey(store, account);
  return account;
}

/** True when the account is the seeded, non-financial demo wallet. */
export function isDemoAccount(account: Pick<DemoAccount, "demo" | "email"> | null | undefined) {
  if (!account) return false;
  if (account.demo) return true;
  return account.email?.toLowerCase() === "demo@trustifysmm.com";
}

/**
 * Register or refresh a customer wallet without resetting balance.
 *
 * Real customer accounts keep their plaintext `key` because it is the foreign key used by
 * invoices, orders and ledger rows (and the dashboard key display). A `keyHash` is stored
 * alongside it so authentication never depends on a plaintext comparison.
 *
 * The seeded demo account never reaches this path with a plaintext key: it is created by
 * `defaultStore()` with a hash only.
 */
export async function ensureDemoAccount(input: { email: string; key: string; balance: number }) {
  const keyHash = hashApiKey(input.key);
  const store = await ensureStore();
  const byKey = store.accounts.find((a) => keyMatchesRecord(input.key, a));
  const byEmail = store.accounts.find((a) => a.email.toLowerCase() === input.email.toLowerCase());
  if (byKey) {
    byKey.email = input.email;
    byKey.keyHash = keyHash;
    await persist(store);
    return byKey;
  }
  if (byEmail) {
    byEmail.keyHash = keyHash;
    // Plaintext key material is never persisted for a wallet.
    delete byEmail.key;
    await persist(store);
    return byEmail;
  }
  const account: DemoAccount = {
    keyHash,
    email: input.email,
    balance: input.balance,
    currency: "USD",
  };
  store.accounts.push(account);
  await persist(store);
  return account;
}

function pushLedger(
  store: StoreFile,
  entry: Omit<LedgerEntry, "id" | "createdAt" | "status" | "balanceAfter"> & { balanceAfter: number },
) {
  store.transactions.push({
    id: `txn_${randomBytes(8).toString("hex")}`,
    status: "completed",
    createdAt: new Date().toISOString(),
    ...entry,
  });
}

export async function addBalance(
  key: string,
  amountUsd: number,
  meta?: { type?: LedgerEntry["type"]; description?: string; ref?: string },
) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const account = accountByKey(store, key);
    if (!account) return null;
    account.balance = Math.round((account.balance + amountUsd) * 10000) / 10000;
    if (account.balance < 0) account.balance = 0;
    pushLedger(store, {
      accountKey: key,
      type: meta?.type ?? "deposit",
      amount: Math.round(amountUsd * 10000) / 10000,
      balanceAfter: account.balance,
      description: meta?.description ?? "Wallet credit",
      ref: meta?.ref,
    });
    await persist(store);
    return account;
  });
}

export async function createDemoOrder(input: {
  key: string;
  service: number;
  link: string;
  quantity: number;
  charge: number;
  channel?: "dashboard" | "api";
}) {
  const placed = await placeOrdersAtomic({
    key: input.key,
    idempotencyKey: "",
    channel: input.channel ?? "api",
    rows: [input],
  });
  if ("error" in placed && placed.error) return { error: placed.error };
  const order = "orders" in placed ? placed.orders[0] : undefined;
  if (!order) return { error: "Not enough funds" as const };
  return { order };
}

export async function placeOrdersAtomic(input: {
  key: string;
  idempotencyKey: string;
  channel?: "dashboard" | "api";
  rows: { service: number; link: string; quantity: number; charge: number }[];
}) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const account = accountByKey(store, input.key);
    if (!account) return { error: "Invalid API key" as const };
    if (account.revoked) return { error: "API key is revoked" as const };

    if (input.idempotencyKey) {
      const prior = store.idempotency.find((row) => row.key === input.idempotencyKey && row.accountKey === input.key);
      if (prior) {
        const orders = prior.orderIds
          .map((id) => store.orders.find((order) => order.order === id))
          .filter((order): order is DemoOrder => Boolean(order));
        return { orders, replay: true as const, balance: account.balance };
      }
    }

    const total = Math.round(input.rows.reduce((sum, row) => sum + row.charge, 0) * 10000) / 10000;
    if (account.balance + 0.00001 < total) return { error: "Not enough funds" as const };

    const created: DemoOrder[] = [];
    for (const row of input.rows) {
      const charge = Math.round(row.charge * 10000) / 10000;
      account.balance = Math.round((account.balance - charge) * 10000) / 10000;
      const order: DemoOrder = {
        order: store.nextOrderId++,
        service: row.service,
        link: row.link,
        quantity: row.quantity,
        charge,
        status: "Pending",
        remains: row.quantity,
        start_count: 0,
        currency: "USD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accountKey: input.key,
        channel: input.channel ?? "dashboard",
      };
      store.orders.push(order);
      created.push(order);
      pushLedger(store, {
        accountKey: input.key,
        type: "order",
        amount: -charge,
        balanceAfter: account.balance,
        description: `Order #${order.order} · service ${row.service}`,
        ref: String(order.order),
      });
    }

    if (account.balance < 0) return { error: "Not enough funds" as const };

    if (input.idempotencyKey) {
      store.idempotency.push({
        key: input.idempotencyKey,
        accountKey: input.key,
        orderIds: created.map((order) => order.order),
        createdAt: new Date().toISOString(),
      });
      store.idempotency = store.idempotency.slice(-500);
    }

    await persist(store);
    return { orders: created, replay: false as const, balance: account.balance };
  });
}

export async function updateOrderStatus(orderId: number, status: DemoOrder["status"], remains?: number) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const order = store.orders.find((row) => row.order === orderId);
    if (!order) return null;
    order.status = status;
    if (remains !== undefined && Number.isFinite(remains)) order.remains = remains;
    order.updatedAt = new Date().toISOString();
    await persist(store);
    return order;
  });
}

export async function getOrder(orderId: number) {
  const store = await ensureStore();
  return store.orders.find((o) => o.order === orderId) ?? null;
}

export async function listOrdersForKey(key: string, ids: number[]) {
  const store = await ensureStore();
  const mine = store.orders.filter((order) => order.accountKey === key);
  if (ids.length === 0) return mine.slice(-50);
  return ids.map((id) => mine.find((order) => order.order === id)).filter(Boolean) as DemoOrder[];
}

export async function listOrdersByAccount(key: string) {
  const store = await ensureStore();
  return store.orders.filter((order) => order.accountKey === key).sort((a, b) => b.order - a.order);
}

export async function listAllOrders() {
  const store = await ensureStore();
  return [...store.orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listAllLedger() {
  const store = await ensureStore();
  return [...store.transactions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listLedger(key: string) {
  const store = await ensureStore();
  return store.transactions.filter((row) => row.accountKey === key).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listAllInvoices() {
  const store = await ensureStore();
  return [...store.invoices].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function adjustAccount(
  key: string,
  delta: number,
  description: string,
  ref?: string,
  /**
   * Customer email. When supplied and no wallet exists for the key, the wallet is created so an
   * admin credit or debit always has somewhere to land.
   */
  ownerEmail?: string,
) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    let account = accountByKey(store, key);
    let createdWallet = false;
    if (!account && ownerEmail?.trim()) {
      const keyHash = hashApiKey(key);
      account = { keyHash, email: ownerEmail.trim(), balance: 0, currency: "USD" };
      store.accounts.push(account);
      createdWallet = true;
    }
    if (!account) return { error: "Wallet not found." as const };
    const amount = Math.round(delta * 10000) / 10000;
    if (!Number.isFinite(amount) || amount === 0) return { error: "Enter an amount greater than zero." as const };
    if (ref && store.transactions.some((row) => row.ref === ref)) {
      return { error: "This reference was already used." as const };
    }
    const next = Math.round((account.balance + amount) * 10000) / 10000;
    if (next < 0) return { error: "That debit would make the wallet negative." as const };
    account.balance = next;
    pushLedger(store, {
      accountKey: key,
      type: amount > 0 ? "adjustment" : "adjustment",
      amount,
      balanceAfter: next,
      description,
      ref,
    });
    await persist(store);
    return { account, createdWallet };
  });
}

export async function adjustAccountExact(
  key: string,
  amountUsd: string,
  description: string,
  ref: string,
  meta: { adminId: string; reason: string },
) {
  const { decimalToScaled, scaledToDecimal } = await import("@/lib/nowpayments/money");
  return withStoreLock(async () => {
    const scaled = decimalToScaled(amountUsd, 2);
    if (scaled === null || scaled === BigInt(0)) return { error: "Invalid USD amount." as const };
    const store = await ensureStore();
    if (store.transactions.some((row) => row.ref === ref)) {
      return { error: "This adjustment was already recorded." as const };
    }
    const account = accountByKey(store, key);
    if (!account) return { error: "Wallet not found." as const };
    const current = decimalToScaled(account.balance, 2);
    if (current === null) return { error: "Wallet balance is not a valid USD amount." as const };
    const next = current + scaled;
    if (next < BigInt(0)) return { error: "That debit would make the wallet negative." as const };
    account.balance = Number(scaledToDecimal(next, 2));
    pushLedger(store, {
      accountKey: key,
      type: "adjustment",
      amount: Number(scaledToDecimal(scaled, 2)),
      balanceAfter: account.balance,
      description,
      ref,
      adminId: meta.adminId,
      reason: meta.reason,
    });
    await persist(store);
    return { account, ref };
  });
}

export async function attachUpstreamOrder(orderId: number, upstreamOrderId: string, upstreamServiceId?: number) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const order = store.orders.find((row) => row.order === orderId);
    if (!order) return null;
    order.upstreamOrderId = upstreamOrderId;
    if (upstreamServiceId !== undefined) order.upstreamServiceId = upstreamServiceId;
    order.status = "Processing";
    order.updatedAt = new Date().toISOString();
    await persist(store);
    return order;
  });
}

export async function refundOrder(orderId: number, description: string) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const order = store.orders.find((row) => row.order === orderId);
    if (!order) return { error: "Order not found." as const };
    if (!order.accountKey) return { error: "This order is not linked to a customer wallet." as const };
    if (order.status === "Refunded") return { error: "This order is already refunded." as const };
    const account = accountByKey(store, order.accountKey ?? "");
    if (!account) return { error: "Wallet not found." as const };
    const amount = Math.round(order.charge * 10000) / 10000;
    if (amount < 0) return { error: "Invalid charge." as const };
    account.balance = Math.round((account.balance + amount) * 10000) / 10000;
    order.status = "Refunded";
    order.updatedAt = new Date().toISOString();
    pushLedger(store, {
      accountKey: order.accountKey as string,
      type: "refund",
      amount,
      balanceAfter: account.balance,
      description,
      ref: `refund:${order.order}`,
    });
    await persist(store);
    return { order, account };
  });
}

export async function setAccountBalance(key: string, nextBalance: number, description: string, ownerEmail?: string) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    let account = accountByKey(store, key);
    if (!account && ownerEmail?.trim()) {
      account = { keyHash: hashApiKey(key), email: ownerEmail.trim(), balance: 0, currency: "USD" };
      store.accounts.push(account);
    }
    if (!account) return null;
    const next = Math.round(nextBalance * 10000) / 10000;
    if (!Number.isFinite(next) || next < 0) return null;
    const delta = Math.round((next - account.balance) * 10000) / 10000;
    account.balance = next;
    if (delta !== 0) {
      pushLedger(store, {
        accountKey: key,
        type: "adjustment",
        amount: delta,
        balanceAfter: next,
        description,
      });
    }
    await persist(store);
    return account;
  });
}

export async function listInvoicesForKey(key: string) {
  const store = await ensureStore();
  return store.invoices.filter((invoice) => invoice.apiKey === key).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function rotateAccountKey(oldKey: string, newKey: string) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const account = accountByKey(store, oldKey);
    if (!account) return null;
    /*
     * Keys are stored hashed, so rotation replaces the hash. Orders and ledger rows keep the
     * plaintext key they were created with as their owner reference, so those move too.
     */
    delete account.key;
    account.keyHash = hashApiKey(newKey);
    account.revoked = false;
    for (const order of store.orders) if (order.accountKey === oldKey) order.accountKey = newKey;
    for (const invoice of store.invoices) if (invoice.apiKey === oldKey) invoice.apiKey = newKey;
    for (const row of store.transactions) if (row.accountKey === oldKey) row.accountKey = newKey;
    for (const row of store.idempotency) if (row.accountKey === oldKey) row.accountKey = newKey;
    await persist(store);
    return account;
  });
}

export async function setAccountRevoked(key: string, revoked: boolean) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const account = accountByKey(store, key);
    if (!account) return null;
    account.revoked = revoked;
    await persist(store);
    return account;
  });
}

export async function saveInvoice(invoice: BankerInvoice) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    store.invoices.push(invoice);
    await persist(store);
    return invoice;
  });
}

/**
 * Patch one invoice.
 *
 * Runs inside `withStoreLock` so the read-modify-write cycle cannot interleave with a wallet
 * credit. Without the lock, a stale copy loaded before a credit could be written back and
 * silently revert `walletCredited` / the balance-adjacent fields — a double-credit risk.
 * No locked function calls this, so there is no re-entrancy.
 */
export async function updateInvoice(id: string, patch: Partial<BankerInvoice>) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) return null;
    Object.assign(inv, patch);
    await persist(store);
    return inv;
  });
}

export async function getInvoice(id: string) {
  const store = await ensureStore();
  return store.invoices.find((i) => i.id === id) ?? null;
}

export async function getInvoiceByNowPaymentId(nowPaymentId: string) {
  const store = await ensureStore();
  const needle = nowPaymentId.trim();
  return store.invoices.find((i) => i.nowPaymentId === needle) ?? null;
}

export async function finalizeDepositCredit(
  invoiceId: string,
  patch: Partial<BankerInvoice>,
): Promise<{ ok: true; balance: number; invoice: BankerInvoice; duplicate: boolean } | { error: string }> {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const invoice = store.invoices.find((row) => row.id === invoiceId);
    if (!invoice) return { error: "Invoice not found" };
    const duplicate = Boolean(invoice.walletCredited || invoice.status === "paid");
    const credited = creditWalletDepositLocked(store, invoice);
    if ("error" in credited) return credited;
    Object.assign(invoice, patch);
    await persist(store);
    return { ok: true, balance: credited.balance, invoice, duplicate };
  });
}

/** Find the wallet that owns a stored invoice apiKey (plaintext FK). */
function findAccountByRef(store: StoreFile, apiKeyRef: string): DemoAccount | null {
  const ref = (apiKeyRef ?? "").trim();
  if (!ref) return null;
  return (
    store.accounts.find((a) => a.key && a.key === ref) ??
    store.accounts.find((a) => a.keyHash && a.keyHash === hashApiKey(ref)) ??
    null
  );
}

/** Credit wallet once per deposit ref (must run inside withStoreLock). */
export function creditWalletDepositLocked(
  store: StoreFile,
  invoice: BankerInvoice,
  meta?: { description?: string },
): { ok: true; balance: number } | { error: string } {
  /*
   * The seeded demo wallet is excluded from every provider credit path. Demo balance changes
   * stay isolated to the demo ledger and can never be funded by a real payment.
   */
  const target = findAccountByRef(store, invoice.apiKey);
  if (isDemoAccount(target)) {
    return { error: "The demo account cannot receive real deposit credits." };
  }

  if (invoice.walletCredited || invoice.status === "paid") {
    return { ok: true, balance: target?.balance ?? 0 };
  }
  if (store.transactions.some((row) => row.ref === invoice.id && row.type === "deposit")) {
    return { ok: true, balance: target?.balance ?? 0 };
  }
  const account = target;
  if (!account) return { error: "Account not found" };
  account.balance = Math.round((account.balance + invoice.amountUsd) * 10000) / 10000;
  pushLedger(store, {
    accountKey: invoice.apiKey,
    type: "deposit",
    amount: Math.round(invoice.amountUsd * 10000) / 10000,
    balanceAfter: account.balance,
    description: meta?.description ?? `Crypto deposit ${invoice.id}`,
    ref: invoice.id,
  });
  return { ok: true, balance: account.balance };
}