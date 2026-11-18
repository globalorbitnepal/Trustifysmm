export type SmmApiParams = Record<string, string>;

export type DemoAccount = {
  /** Legacy plaintext key. Migrated to `keyHash` on the next write. */
  key?: string;
  /** SHA-256 of the API key. Preferred field. */
  keyHash?: string;
  email: string;
  balance: number;
  currency: "USD";
  revoked?: boolean;
  /** Marks the seeded demo account so it can be excluded from financial operations. */
  demo?: boolean;
};

export type DemoOrder = {
  order: number;
  service: number;
  link: string;
  quantity: number;
  charge: number;
  status: "Pending" | "Processing" | "In progress" | "Completed" | "Partial" | "Canceled" | "Refunded";
  remains: number;
  start_count: number;
  currency: "USD";
  createdAt: string;
  accountKey?: string;
  updatedAt?: string;
  upstreamOrderId?: string;
  /** Provider service id, kept so status, cancel and refill always hit the right service. */
  upstreamServiceId?: number;
  upstreamStatus?: string;
};

export type DepositStatusHistory = { status: string; providerStatus?: string; at: string };

export type BankerInvoice = {
  id: string;
  apiKey: string;
  userId?: string;
  amountUsd: number;
  status: "pending" | "confirming" | "paid" | "expired" | "failed" | "partial" | "review";
  provider: "demo" | "nowpayments";
  payUrl?: string;
  address?: string;
  createdAt: string;
  paidAt?: string;
  payCurrency?: string;
  payAmount?: string;
  actuallyPaidAmount?: string;
  verifiedFiatUsd?: string;
  overpaidCrypto?: string;
  reviewReason?: string;
  txHash?: string;
  expiresAt?: string;
  nowPaymentId?: string;
  providerStatus?: string;
  network?: string;
  walletCredited?: boolean;
  creditedAmountUsd?: number;
  statusHistory?: DepositStatusHistory[];
  ipnProcessedAt?: string[];
  /** SHA-256 of the payment access token. The plaintext is returned once at creation. */
  accessTokenHash?: string;
  /**
   * Super Admin reconciliation audit. Populated only by
   * `reconcileNowPaymentsDeposit()` — never by a customer request or the browser.
   */
  reconciledAt?: string;
  reconciledBy?: string;
  reconcileResult?: string;
  reconcileProviderStatus?: string;
  reconcileHistory?: DepositReconcileEntry[];
};

export type DepositReconcileEntry = {
  at: string;
  adminId: string;
  providerStatus: string;
  /** "credited" | "already_credited" | "review" | "no_credit" | "unknown_deposit" | "error" */
  result: string;
  reason?: string;
};