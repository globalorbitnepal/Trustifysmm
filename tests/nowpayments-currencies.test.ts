import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch;
const originalKey = process.env.NOWPAYMENTS_API_KEY;
const originalIpn = process.env.NOWPAYMENTS_IPN_SECRET;
const originalCoins = process.env.BANKER_PAY_CURRENCIES;

function setEnv(coins = "usdttrc20,usdterc20,btc,eth,ltc") {
  process.env.NOWPAYMENTS_API_KEY = "test-key";
  process.env.NOWPAYMENTS_IPN_SECRET = "test-ipn";
  process.env.BANKER_PAY_CURRENCIES = coins;
}

function mockProvider(rows: unknown[]) {
  global.fetch = vi.fn(async () =>
    new Response(JSON.stringify({ currencies: rows }), { status: 200, headers: { "Content-Type": "application/json" } }),
  ) as unknown as typeof fetch;
}

afterEach(() => {
  global.fetch = originalFetch;
  process.env.NOWPAYMENTS_API_KEY = originalKey;
  process.env.NOWPAYMENTS_IPN_SECRET = originalIpn;
  process.env.BANKER_PAY_CURRENCIES = originalCoins;
  vi.resetModules();
});

describe("NOWPayments deposit options", () => {
  it("uses provider identifiers and keeps networks separate", async () => {
    setEnv();
    mockProvider([
      { code: "USDTTRC20", name: "Tether USD (Tron)", enable: true, network: "trx" },
      { code: "USDTERC20", name: "Tether USD (Ethereum)", enable: true, network: "eth" },
      { code: "BTC", name: "Bitcoin", enable: true, network: "btc" },
      { code: "ETH", name: "Ethereum", enable: true, network: "eth" },
      { code: "LTC", name: "Litecoin", enable: true, network: "ltc" },
    ]);
    const { listDepositOptions } = await import("@/lib/nowpayments/currencies");
    const options = await listDepositOptions();
    const codes = options.map((row) => row.code);
    expect(codes).toContain("usdttrc20");
    expect(codes).toContain("usdterc20");
    const trc = options.find((row) => row.code === "usdttrc20");
    const erc = options.find((row) => row.code === "usdterc20");
    expect(trc?.network).toBe("trx");
    expect(erc?.network).toBe("eth");
    expect(trc?.networkLabel).not.toBe(erc?.networkLabel);
    expect(options.find((row) => row.code === "btc")?.networkLabel).toBe("Bitcoin");
  });

  it("drops currencies the provider reports as disabled or missing", async () => {
    setEnv();
    mockProvider([
      { code: "USDTTRC20", name: "Tether USD (Tron)", enable: true, network: "trx" },
      { code: "BTC", name: "Bitcoin", enable: false, network: "btc" },
    ]);
    const { listDepositOptions } = await import("@/lib/nowpayments/currencies");
    const options = await listDepositOptions();
    expect(options.map((row) => row.code)).toEqual(["usdttrc20"]);
  });

  it("returns an empty list when the gateway is not configured", async () => {
    process.env.NOWPAYMENTS_API_KEY = "";
    process.env.NOWPAYMENTS_IPN_SECRET = "";
    const { listDepositOptions } = await import("@/lib/nowpayments/currencies");
    expect(await listDepositOptions()).toEqual([]);
  });
});