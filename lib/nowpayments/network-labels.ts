/**
 * Client-safe network label map. No server imports, no secrets.
 * Used by both the server currency list and the customer checkout display.
 */
export const NETWORK_LABELS: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  trx: "TRON (TRC20)",
  bsc: "BNB Smart Chain (BEP20)",
  matic: "Polygon",
  sol: "Solana",
  ltc: "Litecoin",
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
