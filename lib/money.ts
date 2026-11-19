/** Customer wallet amounts are stored and shown to 4 decimals. Never round these to cents. */
export function formatWalletUsd(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `$${value.toFixed(4)}`;
}
