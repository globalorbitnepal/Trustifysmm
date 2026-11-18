import { afterEach, describe, expect, it, vi } from "vitest";
import { feeFromQuotes, minAmountQuery, providerMinUsd } from "@/lib/nowpayments/client";

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

describe("NOWPayments fee and minimum", () => {
  it("asks for the minimum of the coin the customer sends", () => {
    const query = minAmountQuery("ltc");
    expect(query.get("currency_from")).toBe("ltc");
    expect(query.get("currency_to")).toBe("usd");
    expect(query.get("is_fee_paid_by_user")).toBe("true");
    expect(query.get("is_fixed_rate")).toBe("true");
  });

  it("rounds each coin's fiat minimum up to the next cent", () => {
    expect(providerMinUsd({ fiat_equivalent: 6.7615239 })).toBe(6.77);
    expect(providerMinUsd({ fiat_equivalent: 11.99100031 })).toBe(12);
  });

  it("uses only the gap between the provider quotes as the customer fee", () => {
    const fee = feeFromQuotes(10, "0.22840295", "0.23237967");
    expect(fee?.feeUsd).toBe(0.17);
    expect(feeFromQuotes(10, 0.26771257, 0.27342385)?.feeUsd).toBe(0.21);
    expect(feeFromQuotes(25, "25", "20")).toBeNull();
  });
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
    expect(options.find((row) => row.code === "btc")?.symbol).toBe("BTC");
  });

  it("keeps BNB and SOL when the provider enables them, with separate networks", async () => {
    setEnv("usdtbsc,bnbbsc,sol");
    mockProvider([
      { code: "USDTBSC", name: "Tether USD (BSC)", enable: true, network: "bsc", logo_url: "/images/coins/usdtbsc.svg" },
      { code: "BNBBSC", name: "Binance Coin (BSC)", enable: true, network: "bsc", logo_url: "/images/coins/bnbbsc.svg" },
      { code: "SOL", name: "Solana", enable: true, network: "sol", logo_url: "https://evil.example/sol.svg" },
    ]);
    const { listDepositOptions, providerLogoUrl } = await import("@/lib/nowpayments/currencies");
    const { networkBadge } = await import("@/lib/nowpayments/network-labels");
    const options = await listDepositOptions();
    const usdt = options.find((row) => row.code === "usdtbsc");
    const bnb = options.find((row) => row.code === "bnbbsc");
    const sol = options.find((row) => row.code === "sol");
    expect(usdt?.symbol).toBe("USDT");
    expect(networkBadge("usdtbsc", "bsc")).toBe("BEP20");
    expect(networkBadge("trx", "trx")).toBe("TRON");
    expect(networkBadge("dash", "dash")).toBe("Dash");
    expect(networkBadge("xrp", "xrp")).toBe("XRP Ledger");
    expect(networkBadge("usdttrc20", "trx")).toBe("TRC20");
    expect(bnb?.symbol).toBe("BNB");
    expect(bnb?.networkLabel).toBe("BNB Smart Chain (BEP20)");
    expect(sol?.symbol).toBe("SOL");
    expect(sol?.network).toBe("sol");
    expect(usdt?.logoUrl).toBe("https://nowpayments.io/images/coins/usdtbsc.svg");
    expect(providerLogoUrl("https://evil.example/sol.svg")).toBeNull();
    expect(sol?.logoUrl).toBeNull();
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