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

/** Plain reason shown to the customer. A failed or unmatched payment never implies a credit. */
export function customerDepositReason(input: {
  status?: string | null;
  providerStatus?: string | null;
  reviewReason?: string | null;
}): string | null {
  const status = (input.status ?? "").toLowerCase();
  const provider = (input.providerStatus ?? "").toLowerCase();
  const reason = (input.reviewReason ?? "").toLowerCase();
  if (status === "paid" || status === "pending" || status === "confirming") return null;
  if (reason === "underpaid" || status === "partial") {
    return "The crypto received was less than the exact amount. Nothing was added to your wallet.";
  }
  if (status === "expired" || provider === "expired") {
    return "The payment window ended before the transfer was confirmed. Nothing was added to your wallet.";
  }
  if (provider === "refunded") {
    return "The provider refunded this payment. Nothing was added to your wallet.";
  }
  if (status === "failed") {
    return "The provider could not complete this payment. Nothing was added to your wallet.";
  }
  if (status === "review") {
    return "This payment did not match the deposit. Nothing was added to your wallet.";
  }
  return null;
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