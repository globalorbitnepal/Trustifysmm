import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { BankerInvoice, DemoAccount, DemoOrder } from "@/lib/smm-api/types";
import { withStoreLock } from "@/lib/runtime-lock";

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

const defaultStore = (): StoreFile => ({
  accounts: [
    {
      key: process.env.DEMO_API_KEY?.trim() || "trustify-demo-key-change-me",
      email: "demo@trustifysmm.com",
      balance: 100,
      currency: "USD",
    },
  ],
  orders: [],
  invoices: [],
  transactions: [],
  idempotency: [],
  nextOrderId: 900001,
});

async function ensureStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    parsed.transactions ??= [];
    parsed.idempotency ??= [];
    parsed.orders ??= [];
    parsed.invoices ??= [];
    parsed.accounts ??= [];
    return parsed;
  } catch {
    const initial = defaultStore();
    await persist(initial);
    return initial;
  }
}

async function persist(store: StoreFile) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getAccountByKey(key: string) {
  const store = await ensureStore();
  return store.accounts.find((a) => a.key === key) ?? null;
}

/** Register or refresh a customer wallet without resetting balance. */
export async function ensureDemoAccount(input: { email: string; key: string; balance: number }) {
  const store = await ensureStore();
  const byKey = store.accounts.find((a) => a.key === input.key);
  const byEmail = store.accounts.find((a) => a.email.toLowerCase() === input.email.toLowerCase());
  if (byKey) {
    byKey.email = input.email;
    await persist(store);
    return byKey;
  }
  if (byEmail) {
    byEmail.key = input.key;
    await persist(store);
    return byEmail;
  }
  const account: DemoAccount = {
    key: input.key,
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
    const account = store.accounts.find((a) => a.key === key);
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
}) {
  const placed = await placeOrdersAtomic({
    key: input.key,
    idempotencyKey: "",
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
  rows: { service: number; link: string; quantity: number; charge: number }[];
}) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const account = store.accounts.find((a) => a.key === input.key);
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
) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const account = store.accounts.find((row) => row.key === key);
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
    return { account };
  });
}

export async function refundOrder(orderId: number, description: string) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const order = store.orders.find((row) => row.order === orderId);
    if (!order) return { error: "Order not found." as const };
    if (!order.accountKey) return { error: "This order is not linked to a customer wallet." as const };
    if (order.status === "Refunded") return { error: "This order is already refunded." as const };
    const account = store.accounts.find((row) => row.key === order.accountKey);
    if (!account) return { error: "Wallet not found." as const };
    const amount = Math.round(order.charge * 10000) / 10000;
    if (amount < 0) return { error: "Invalid charge." as const };
    account.balance = Math.round((account.balance + amount) * 10000) / 10000;
    order.status = "Refunded";
    order.updatedAt = new Date().toISOString();
    pushLedger(store, {
      accountKey: account.key,
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

export async function setAccountBalance(key: string, nextBalance: number, description: string) {
  return withStoreLock(async () => {
    const store = await ensureStore();
    const account = store.accounts.find((row) => row.key === key);
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
    const account = store.accounts.find((row) => row.key === oldKey);
    if (!account) return null;
    account.key = newKey;
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
    const account = store.accounts.find((row) => row.key === key);
    if (!account) return null;
    account.revoked = revoked;
    await persist(store);
    return account;
  });
}

export async function saveInvoice(invoice: BankerInvoice) {
  const store = await ensureStore();
  store.invoices.push(invoice);
  await persist(store);
  return invoice;
}

export async function updateInvoice(id: string, patch: Partial<BankerInvoice>) {
  const store = await ensureStore();
  const inv = store.invoices.find((i) => i.id === id);
  if (!inv) return null;
  Object.assign(inv, patch);
  await persist(store);
  return inv;
}

export async function getInvoice(id: string) {
  const store = await ensureStore();
  return store.invoices.find((i) => i.id === id) ?? null;
}