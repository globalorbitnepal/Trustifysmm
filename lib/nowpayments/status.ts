export type ProviderPaymentStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "refunded"
  | "expired"
  | string;

export type InternalDepositStatus = "pending" | "confirming" | "paid" | "partial" | "expired" | "failed";

export function normalizeProviderStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

export function mapProviderToInternal(status: string): InternalDepositStatus {
  const s = normalizeProviderStatus(status);
  if (s === "finished") return "paid";
  if (s === "confirmed" || s === "sending") return "confirming";
  if (s === "confirming") return "confirming";
  if (s === "partially_paid") return "partial";
  if (s === "failed" || s === "refunded") return "failed";
  if (s === "expired") return "expired";
  return "pending";
}

/** Only these provider statuses may credit the wallet (verified IPN required). */
export function providerStatusCreditsWallet(status: string): boolean {
  return normalizeProviderStatus(status) === "finished";
}

export function customerStatusLabel(internal: InternalDepositStatus): string {
  const labels: Record<InternalDepositStatus, string> = {
    pending: "Waiting for payment",
    confirming: "Confirming on-chain",
    paid: "Credited",
    partial: "Partially paid",
    expired: "Expired",
    failed: "Failed",
  };
  return labels[internal] ?? internal;
}