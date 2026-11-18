/**
 * Client-safe network label map. No server imports, no secrets.
 * Used by both the server currency list and the customer checkout display.
 */
export const NETWORK_LABELS: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  trx: "TRON",
  bsc: "BNB Smart Chain (BEP20)",
  matic: "Polygon",
  sol: "Solana",
  ltc: "Litecoin",
  dash: "Dash",
  xrp: "XRP Ledger",
  doge: "Dogecoin",
  ton: "TON",
  arbitrum: "Arbitrum",
  base: "Base",
  op: "Optimism",
  avaxc: "Avalanche C-Chain",
};

export function networkLabel(network?: string | null) {
  const key = (network ?? "").trim().toLowerCase();
  if (!key) return "Network not reported";
  return NETWORK_LABELS[key] ?? key.toUpperCase();
}

/** Short badge shown after the coin logo. USDT on BSC is BEP20, not a second coin. */
export function networkBadge(code: string, network?: string | null) {
  const n = (network ?? "").trim().toLowerCase();
  const c = code.trim().toLowerCase();
  const token = c.startsWith("usdt") || c.startsWith("usdc");
  if (token || c.startsWith("bnb")) {
    if (n === "trx") return "TRC20";
    if (n === "eth") return "ERC20";
    if (n === "bsc") return "BEP20";
    if (n === "matic") return "Polygon";
    if (n === "sol") return "Solana";
  }
  return networkLabel(n);
}
