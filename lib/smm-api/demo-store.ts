import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BankerInvoice, DemoAccount, DemoOrder } from "@/lib/smm-api/types";

type StoreFile = {
  accounts: DemoAccount[];
  orders: DemoOrder[];
  invoices: BankerInvoice[];
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
  nextOrderId: 900001,
});

async function ensureStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreFile;
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

export async function addBalance(key: string, amountUsd: number) {
  const store = await ensureStore();
  const account = store.accounts.find((a) => a.key === key);
  if (!account) return null;
  account.balance = Math.round((account.balance + amountUsd) * 10000) / 10000;
  await persist(store);
  return account;
}

export async function createDemoOrder(input: {
  key: string;
  service: number;
  link: string;
  quantity: number;
  charge: number;
}) {
  const store = await ensureStore();
  const account = store.accounts.find((a) => a.key === input.key);
  if (!account) return { error: "Invalid API key" as const };
  if (account.balance < input.charge) return { error: "Not enough funds" as const };

  account.balance = Math.round((account.balance - input.charge) * 10000) / 10000;
  const order: DemoOrder = {
    order: store.nextOrderId++,
    service: input.service,
    link: input.link,
    quantity: input.quantity,
    charge: input.charge,
    status: "Pending",
    remains: input.quantity,
    start_count: 0,
    currency: "USD",
    createdAt: new Date().toISOString(),
  };
  store.orders.push(order);
  await persist(store);
  return { order };
}

export async function getOrder(orderId: number) {
  const store = await ensureStore();
  return store.orders.find((o) => o.order === orderId) ?? null;
}

export async function listOrdersForKey(key: string, ids: number[]) {
  const store = await ensureStore();
  if (ids.length === 0) return store.orders.filter((o) => o.service > 0).slice(-50);
  return ids.map((id) => store.orders.find((o) => o.order === id)).filter(Boolean) as DemoOrder[];
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