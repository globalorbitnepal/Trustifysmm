import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/*
 * Runs the real order store against a throwaway directory. The seeded wallet stores only a
 * hashed key, which is exactly how production stores them, so this also guards the wallet
 * lookup used by ordering and refunds.
 */
let dir: string;
let store: typeof import("@/lib/smm-api/demo-store");
const KEY = "tsm_audit_key_1234567890";
const STORE_FILE = () => path.join(dir, "data", "runtime", "api-store.json");

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "trustify-orders-"));
  mkdirSync(path.join(dir, "data", "runtime"), { recursive: true });
  writeFileSync(
    STORE_FILE(),
    JSON.stringify({
      accounts: [{ keyHash: createHash("sha256").update(KEY, "utf8").digest("hex"), email: "audit@example.com", balance: 5, currency: "USD" }],
      orders: [],
      invoices: [],
      transactions: [],
      idempotency: [],
      // A legacy counter, exactly like the production file before the fix.
      nextOrderId: 900002,
    }),
  );
  process.chdir(dir);
  store = await import("@/lib/smm-api/demo-store");
});

afterAll(() => process.chdir(path.resolve(__dirname, "..")));

describe("orders numbered from 1100", () => {
  it("finds a wallet that stores only a hashed key", async () => {
    const account = await store.getAccountByKey(KEY);
    expect(account?.email).toBe("audit@example.com");
  });

  it("starts at 1100 and increases one by one", async () => {
    const first = await store.createDemoOrder({ key: KEY, service: 10001, link: "https://example.com/a", quantity: 10, charge: 0.1 });
    const second = await store.createDemoOrder({ key: KEY, service: 10001, link: "https://example.com/b", quantity: 10, charge: 0.1 });
    expect("error" in first).toBe(false);
    expect("error" in second).toBe(false);
    if ("error" in first || "error" in second) return;
    expect(first.order.order).toBe(1100);
    expect(second.order.order).toBe(1101);
  });

  it("refunds the hashed wallet once and never twice", async () => {
    const placed = await store.createDemoOrder({ key: KEY, service: 10001, link: "https://example.com/c", quantity: 10, charge: 0.25 });
    if ("error" in placed) throw new Error(placed.error);
    const before = await store.getAccountByKey(KEY);
    const refunded = await store.refundOrder(placed.order.order, "Cancelled on request.");
    if ("error" in refunded) throw new Error(refunded.error);
    expect(refunded.order.status).toBe("Refunded");
    expect(refunded.account.balance).toBeCloseTo((before?.balance ?? 0) + 0.25, 4);
    const again = await store.refundOrder(placed.order.order, "Cancelled on request.");
    expect("error" in again).toBe(true);
  });

  it("keeps the reference id on the server record only", async () => {
    const placed = await store.createDemoOrder({ key: KEY, service: 10001, link: "https://example.com/d", quantity: 10, charge: 0.1 });
    if ("error" in placed) throw new Error(placed.error);
    await store.attachUpstreamOrder(placed.order.order, "777888", 3315);
    const stored = await store.getOrder(placed.order.order);
    expect(stored?.upstreamOrderId).toBe("777888");
    expect(stored?.upstreamServiceId).toBe(3315);
    expect(stored?.status).toBe("Processing");
  });

  it("updates status and remains together", async () => {
    const placed = await store.createDemoOrder({ key: KEY, service: 10001, link: "https://example.com/e", quantity: 100, charge: 0.1 });
    if ("error" in placed) throw new Error(placed.error);
    const updated = await store.updateOrderStatus(placed.order.order, "In progress", 40);
    expect(updated?.status).toBe("In progress");
    expect(updated?.remains).toBe(40);
  });

  it("never stores a new plaintext key when a wallet is created", async () => {
    await store.ensureDemoAccount({ email: "fresh@example.com", key: "tsm_fresh_key_000000000000", balance: 0 });
    const raw = JSON.parse(readFileSync(STORE_FILE(), "utf8")) as { accounts: { email: string; keyHash?: string }[] };
    const fresh = raw.accounts.find((row) => row.email === "fresh@example.com");
    expect(fresh?.keyHash).toBeTruthy();
  });
});
