export type NowPaymentsConfig = {
  apiKey: string;
  ipnSecret: string;
  baseUrl: string;
  sandbox: boolean;
  minDepositUsd: number;
  maxDepositUsd: number;
  paymentExpiryMinutes: number;
  payCurrencies: string[];
  configured: boolean;
  live: boolean;
};

function numEnv(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function loadNowPaymentsConfig(): NowPaymentsConfig {
  const apiKey = process.env.NOWPAYMENTS_API_KEY?.trim() ?? "";
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET?.trim() ?? "";
  const sandbox = (process.env.NOWPAYMENTS_SANDBOX ?? "false").toLowerCase() === "true";
  const baseUrl =
    process.env.NOWPAYMENTS_BASE_URL?.trim() ||
    (sandbox ? "https://api-sandbox.nowpayments.io" : "https://api.nowpayments.io");

  const rawCurrencies =
    process.env.BANKER_PAY_CURRENCIES || process.env.BANKER_PAY_CURRENCY || "usdttrc20,btc,eth";
  const payCurrencies = rawCurrencies
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const configured = Boolean(apiKey && ipnSecret);

  return {
    apiKey,
    ipnSecret,
    baseUrl: baseUrl.replace(/\/$/, ""),
    sandbox,
    minDepositUsd: numEnv("NOWPAYMENTS_MIN_DEPOSIT_USD", 1),
    maxDepositUsd: numEnv("NOWPAYMENTS_MAX_DEPOSIT_USD", 50_000),
    paymentExpiryMinutes: numEnv("NOWPAYMENTS_PAYMENT_EXPIRY_MINUTES", 60),
    payCurrencies: configured ? (payCurrencies.length ? payCurrencies : ["usdttrc20"]) : [],
    configured,
    live: configured,
  };
}

export function publicGatewayConfig() {
  const cfg = loadNowPaymentsConfig();
  return {
    live: cfg.live,
    currencies: cfg.payCurrencies,
    minDepositUsd: cfg.minDepositUsd,
    maxDepositUsd: cfg.maxDepositUsd,
    provider: "nowpayments",
    sandbox: cfg.sandbox,
  };
}