import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
const OWNER_KEY = "tsm_concurrencyowner0000000000000001";
let workDir = "";

async function readStore() {
  return JSON.parse(await readFile(path.join(workDir, "data", "runtime", "api-store.json"), "utf8"));
}

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "tsm-lock-"));
  await mkdir(path.join(workDir, "data", "runtime"), { recursive: true });
  await writeFile(
    path.join(workDir, "data", "runtime", "api-store.json"),
    JSON.stringify(
      {
        accounts: [{ key: OWNER_KEY, email: "owner@example.test", balance: 10, currency: "USD" }],
        orders: [],
        invoices: [
          {
            id: "TSM-CONC000001",
            apiKey: OWNER_KEY,
            amountUsd: 25,
            status: "pending",
            provider: "nowpayments",
            createdAt: new Date().toISOString(),
            walletCredited: false,
          },
        ],
        transactions: [],
        idempotency: [],
        nextOrderId: 1,
      },
      null,
      1,
    ),
    "utf8",
  );
  process.chdir(workDir);
  vi.resetModules();
});

afterEach(() => {
  process.chdir(originalCwd);
  vi.resetModules();
});

describe("store write serialisation", () => {
  it("serialises concurrent updateInvoice calls without losing a write", async () => {
    const { updateInvoice } = await import("@/lib/smm-api/demo-store");

    // Fire ten patches concurrently. Without the lock, later writes could be built from a stale
    // copy and lose earlier fields.
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => updateInvoice("TSM-CONC000001", { txHash: `hash-${i}` })),
    );

    const store = await readStore();
    // Exactly one field, last writer wins, no corruption of the surrounding record.
    expect(store.invoices).toHaveLength(1);
    expect(store.invoices[0].status).toBe("pending");
    expect(store.invoices[0].txHash).toMatch(/^hash-\d$/);
    expect(store.accounts[0].balance).toBe(10);
  });

  it("never lets a pending invoice patch undo a completed credit", async () => {
    const { updateInvoice, finalizeDepositCredit } = await import("@/lib/smm-api/demo-store");

    // Credit and a concurrent status patch race each other.
    const [credit] = await Promise.all([
      finalizeDepositCredit("TSM-CONC000001", { status: "paid", walletCredited: true }),
      updateInvoice("TSM-CONC000001", { providerStatus: "waiting" }),
    ]);

    expect("ok" in credit && credit.ok).toBe(true);

    const store = await readStore();
    // The credit must survive: one ledger row, balance credited once.
    expect(store.accounts[0].balance).toBe(35);
    expect(store.transactions).toHaveLength(1);
    expect(store.transactions[0].ref).toBe("TSM-CONC000001");
    expect(store.invoices[0].walletCredited).toBe(true);
  });

  it("serialises concurrent saveInvoice calls with no lost rows", async () => {
    const { saveInvoice } = await import("@/lib/smm-api/demo-store");

    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        saveInvoice({
          id: `TSM-CONC00000${i + 2}`,
          apiKey: OWNER_KEY,
          amountUsd: 5,
          status: "pending",
          provider: "demo",
          createdAt: new Date().toISOString(),
          walletCredited: false,
        }),
      ),
    );

    const store = await readStore();
    expect(store.invoices).toHaveLength(6); // 1 seeded + 5 saved
    const ids = store.invoices.map((row: { id: string }) => row.id).sort();
    expect(ids).toEqual([
      "TSM-CONC000001",
      "TSM-CONC000002",
      "TSM-CONC000003",
      "TSM-CONC000004",
      "TSM-CONC000005",
      "TSM-CONC000006",
    ]);
  });
});
