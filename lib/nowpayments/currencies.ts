import { minNowPaymentAmount, providerMinUsd } from "@/lib/nowpayments/client";
import { loadNowPaymentsConfig } from "@/lib/nowpayments/config";
import { networkLabel } from "@/lib/nowpayments/network-labels";

export type DepositOption = {
  code: string;
  name: string;
  symbol: string;
  network: string;
  networkLabel: string;
  logoUrl: string | null;
  /** Live provider minimum in USD, already rounded up to cents. Null when the provider did not answer. */
  minUsd: number | null;
  popular: boolean;
};

type ProviderCurrency = {
  code?: string;
  name?: string;
  enable?: boolean;
  network?: string;
  logo_url?: string;
};

export { networkLabel };

/** Coins emphasised in the picker. Only shown when the provider marks them enabled. */
const POPULAR_CODES = new Set([
  "usdttrc20",
  "usdterc20",
  "usdtbsc",
  "usdc",
  "btc",
  "eth",
  "bnbbsc",
  "sol",
  "ltc",
  "trx",
  "dash",
  "xrp",
]);

const SYMBOLS: Record<string, string> = {
  usdttrc20: "USDT",
  usdterc20: "USDT",
  usdtbsc: "USDT",
  usdc: "USDC",
  usdcmatic: "USDC",
  bnbbsc: "BNB",
  bnb: "BNB",
  matic: "MATIC",
};

export function networkLabelFor(codeOrNetwork?: string | null) {
  return networkLabel(codeOrNetwork);
}

/**
 * Ticker shown on the coin card.
 *
 * Order of preference:
 *   1. an explicit override (network-specific codes such as usdttrc20 -> USDT)
 *   2. the provider code itself, which for major coins IS the ticker (btc -> BTC)
 *   3. the first word of the provider name, for exotic codes
 *
 * Step 2 matters: deriving from the name turned "Bitcoin" into "BITCOIN" instead of "BTC".
 */
export function providerLogoUrl(logo?: string | null) {
  const raw = (logo ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/images/coins/")) return `https://nowpayments.io${raw}`;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol === "https:" && (host === "nowpayments.io" || host.endsWith(".nowpayments.io"))) {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function symbolFor(code: string, name?: string) {
  if (SYMBOLS[code]) return SYMBOLS[code];
  // Provider codes for major coins are already the ticker.
  if (code.length <= 6 && /^[a-z0-9]+$/i.test(code)) return code.toUpperCase();
  const firstWord = (name ?? "").split(/[\s(]/)[0];
  if (firstWord && firstWord.length <= 8) return firstWord.toUpperCase();
  return code.slice(0, 6).toUpperCase();
}

type Cache = { at: number; currencies: ProviderCurrency[] };
let cache: Cache | null = null;
const minCache = new Map<string, { at: number; usd: number | null }>();
const CACHE_MS = 10 * 60 * 1000;

async function fetchMinUsd(code: string): Promise<number | null> {
  const hit = minCache.get(code);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.usd;
  const quote = await minNowPaymentAmount(code);
  const usd = quote.ok ? providerMinUsd(quote.data) : null;
  minCache.set(code, { at: Date.now(), usd });
  return usd;
}

async function fetchProviderCurrencies(): Promise<ProviderCurrency[]> {
  const cfg = loadNowPaymentsConfig();
  if (!cfg.apiKey) return [];
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.currencies;
  try {
    const res = await fetch(`${cfg.baseUrl}/v1/full-currencies`, {
      headers: { "x-api-key": cfg.apiKey },
      cache: "no-store",
    });
    if (!res.ok) return cache?.currencies ?? [];
    const data = (await res.json()) as { currencies?: ProviderCurrency[] };
    const rows = Array.isArray(data.currencies) ? data.currencies : [];
    cache = { at: Date.now(), currencies: rows };
    return rows;
  } catch {
    return cache?.currencies ?? [];
  }
}

/**
 * Deposit options = our allowlist (BANKER_PAY_CURRENCIES) intersected with
 * coins the provider currently reports as enabled. Network data comes from the provider.
 */
export async function listDepositOptions(): Promise<DepositOption[]> {
  const cfg = loadNowPaymentsConfig();
  if (!cfg.live) return [];
  const allowed = cfg.payCurrencies.map((c) => c.toLowerCase());
  const provider = await fetchProviderCurrencies();
  const byCode = new Map(provider.map((row) => [(row.code ?? "").toLowerCase(), row]));

  const options: DepositOption[] = [];
  for (const code of allowed) {
    const row = byCode.get(code);
    if (provider.length && row && row.enable === false) continue;
    if (provider.length && !row) continue;
    const network = (row?.network ?? "").toLowerCase();
    options.push({
      code,
      name: row?.name ?? code.toUpperCase(),
      symbol: symbolFor(code, row?.name),
      network,
      networkLabel: networkLabel(network),
      logoUrl: providerLogoUrl(row?.logo_url),
      minUsd: null,
      popular: POPULAR_CODES.has(code),
    });
  }
  const mins = await Promise.all(options.map((row) => fetchMinUsd(row.code)));
  return options.map((row, index) => ({ ...row, minUsd: mins[index] ?? null }));
}

export async function findDepositOption(code: string) {
  const needle = code.trim().toLowerCase();
  const options = await listDepositOptions();
  return options.find((row) => row.code === needle) ?? null;
}
