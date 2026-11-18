import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  constantTimeEquals,
  createDepositAccessToken,
  hashDepositAccessToken,
  verifyDepositAccessToken,
} from "@/lib/banker/access";

const originalCwd = process.cwd();
let workDir = "";

const OWNER_KEY = "owner-key-aaaaaaaaaaaaaaaa";
const OTHER_KEY = "other-key-bbbbbbbbbbbbbbbb";

function seedStore() {
  const invoice = {
    id: "TSM-OWNED01",
    apiKey: OWNER_KEY,
    amountUsd: 25,
    status: "pending",
    provider: "nowpayments",
    createdAt: new Date().toISOString(),
    walletCredited: false,
    address: "TRON-SECRET-ADDRESS-0001",
    nowPaymentId: "1000000001",
    network: "trx",
    payCurrency: "usdttrc20",
    payAmount: "25.1",
    accessTokenHash: hashDepositAccessToken("token-for-owned-deposit"),
    statusHistory: [],
  };
  const foreign = {
    id: "TSM-OTHER001",
    apiKey: OTHER_KEY,
    amountUsd: 40,
    status: "pending",
    provider: "nowpayments",
    createdAt: new Date().toISOString(),
    walletCredited: false,
    address: "TRON-SECRET-ADDRESS-0002",
    nowPaymentId: "6155649999",
    network: "trx",
    payCurrency: "usdttrc20",
    statusHistory: [],
  };
  return {
    accounts: [
      { key: OWNER_KEY, email: "owner@example.test", balance: 10, currency: "USD" },
      { key: OTHER_KEY, email: "other@example.test", balance: 5, currency: "USD" },
    ],
    orders: [],
    invoices: [invoice, foreign],
    transactions: [],
    idempotency: [],
    nextOrderId: 1,
  };
}

async function readStore() {
  return JSON.parse(await readFile(path.join(workDir, "data", "runtime", "api-store.json"), "utf8"));
}

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "tsm-b1-"));
  await mkdir(path.join(workDir, "data", "runtime"), { recursive: true });
  await writeFile(
    path.join(workDir, "data", "runtime", "api-store.json"),
    JSON.stringify(seedStore(), null, 1),
    "utf8",
  );
  process.chdir(workDir);
  vi.resetModules();
});

afterEach(() => {
  process.chdir(originalCwd);
  vi.resetModules();
});

async function loadStatusRoute() {
  return import("@/app/api/banker/status/route");
}

async function loadPayRoute() {
  return import("@/app/api/banker/pay/route");
}

function req(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

describe("deposit access token primitives", () => {
  it("issues a high-entropy token and stores only its hash", () => {
    const { token, hash } = createDepositAccessToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
  });

  it("issues a different token every time", () => {
    const a = createDepositAccessToken();
    const b = createDepositAccessToken();
    expect(a.token).not.toBe(b.token);
  });

  it("verifies the matching token and rejects everything else", () => {
    const { token, hash } = createDepositAccessToken();
    expect(verifyDepositAccessToken(token, hash)).toBe(true);
    expect(verifyDepositAccessToken("wrong-token", hash)).toBe(false);
    expect(verifyDepositAccessToken(token, hashDepositAccessToken("other"))).toBe(false);
    expect(verifyDepositAccessToken(token, "")).toBe(false);
    expect(verifyDepositAccessToken(token, undefined)).toBe(false);
    expect(verifyDepositAccessToken("", hash)).toBe(false);
    expect(verifyDepositAccessToken(null, hash)).toBe(false);
  });

  it("compares secrets without leaking length or content", () => {
    expect(constantTimeEquals("same-secret", "same-secret")).toBe(true);
    expect(constantTimeEquals("same-secret", "same-secreu")).toBe(false);
    expect(constantTimeEquals("short", "a-much-longer-secret")).toBe(false);
    expect(constantTimeEquals("", "x")).toBe(false);
    expect(constantTimeEquals(undefined, "x")).toBe(false);
  });
});

describe("GET /api/banker/status authorisation", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(req("https://x.test/api/banker/status?id=TSM-OWNED01"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toMatch(/Authentication required/i);
  });

  it("rejects an invalid API key without revealing anything", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(
      req("https://x.test/api/banker/status?id=TSM-OWNED01", { "x-api-key": "not-the-key" }),
    );
    expect(response.status).toBe(404);
    const text = JSON.stringify(await response.json());
    expect(text).not.toContain("TRON-SECRET");
    expect(text).not.toContain("1000000001");
    expect(text).not.toContain("25.1");
  });

  it("accepts the owning reseller API key", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(
      req("https://x.test/api/banker/status?id=TSM-OWNED01", { "x-api-key": OWNER_KEY }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deposit_id).toBe("TSM-OWNED01");
    expect(body.status).toBe("pending");
  });

  it("accepts a bearer token for the owning reseller", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(
      req("https://x.test/api/banker/status?id=TSM-OWNED01", { authorization: `Bearer ${OWNER_KEY}` }),
    );
    expect(response.status).toBe(200);
  });

  it("accepts the deposit access token for a single deposit", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(
      req("https://x.test/api/banker/status?id=TSM-OWNED01", {
        "x-deposit-token": "token-for-owned-deposit",
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).deposit_id).toBe("TSM-OWNED01");
  });

  it("rejects a missing or invalid deposit access token", async () => {
    const { GET } = await loadStatusRoute();
    const wrong = await GET(
      req("https://x.test/api/banker/status?id=TSM-OWNED01", { "x-deposit-token": "forged-token" }),
    );
    expect(wrong.status).toBe(404);
    expect(JSON.stringify(await wrong.json())).not.toContain("TRON-SECRET");
  });

  it("does not let another customer read this deposit", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(
      req("https://x.test/api/banker/status?id=TSM-OWNED01", { "x-api-key": OTHER_KEY }),
    );
    expect(response.status).toBe(404);
    const text = JSON.stringify(await response.json());
    expect(text).not.toContain("TRON-SECRET");
    expect(text).not.toContain("1000000001");
  });

  it("returns the same 404 for a foreign id and a non-existent id", async () => {
    const { GET } = await loadStatusRoute();
    const foreign = await GET(
      req("https://x.test/api/banker/status?id=TSM-OTHER001", { "x-api-key": OWNER_KEY }),
    );
    const missing = await GET(
      req("https://x.test/api/banker/status?id=TSM-DOESNOTEXIST", { "x-api-key": OWNER_KEY }),
    );
    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await foreign.json()).toEqual(await missing.json());
  });

  it("rejects an API key supplied in the query string", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(req(`https://x.test/api/banker/status?id=TSM-OWNED01&key=${OWNER_KEY}`));
    expect(response.status).toBe(401);
  });

  it("requires an id parameter", async () => {
    const { GET } = await loadStatusRoute();
    const response = await GET(req("https://x.test/api/banker/status", { "x-api-key": OWNER_KEY }));
    expect(response.status).toBe(400);
  });
});

describe("GET /api/banker/pay cannot mutate payment state", () => {
  it("does not credit or confirm even with confirm=1 and a valid key", async () => {
    const { GET } = await loadPayRoute();
    const before = await readStore();
    const response = await GET(
      req("https://x.test/api/banker/pay?id=TSM-OWNED01&confirm=1", { "x-api-key": OWNER_KEY }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.read_only).toBe(true);
    expect(body.message).toMatch(/read-only/i);

    const after = await readStore();
    const invoice = after.invoices.find((row: { id: string }) => row.id === "TSM-OWNED01");
    expect(invoice.status).toBe("pending");
    expect(invoice.walletCredited).toBe(false);
    expect(after.transactions).toHaveLength(0);
    const owner = after.accounts.find((row: { key: string }) => row.key === OWNER_KEY);
    expect(owner.balance).toBe(before.accounts[0].balance);
  });

  it("rejects unauthenticated reads", async () => {
    const { GET } = await loadPayRoute();
    const response = await GET(req("https://x.test/api/banker/pay?id=TSM-OWNED01&confirm=1"));
    expect(response.status).toBe(401);
  });

  it("rejects a foreign deposit", async () => {
    const { GET } = await loadPayRoute();
    const response = await GET(
      req("https://x.test/api/banker/pay?id=TSM-OWNED01", { "x-api-key": OTHER_KEY }),
    );
    expect(response.status).toBe(404);
  });

  it("rejects mutating verbs with 405", async () => {
    const { POST, PUT, PATCH, DELETE } = await loadPayRoute();
    for (const handler of [POST, PUT, PATCH, DELETE]) {
      const response = await handler();
      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe("GET");
    }
    const after = await readStore();
    const invoice = after.invoices.find((row: { id: string }) => row.id === "TSM-OWNED01");
    expect(invoice.status).toBe("pending");
  });
});
