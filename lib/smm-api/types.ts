export type SmmApiParams = Record<string, string>;

export type DemoAccount = {
  key: string;
  email: string;
  balance: number;
  currency: "USD";
  revoked?: boolean;
};

export type DemoOrder = {
  order: number;
  service: number;
  link: string;
  quantity: number;
  charge: number;
  status: "Pending" | "Processing" | "In progress" | "Completed" | "Partial" | "Canceled";
  remains: number;
  start_count: number;
  currency: "USD";
  createdAt: string;
  accountKey?: string;
  updatedAt?: string;
};

export type BankerInvoice = {
  id: string;
  apiKey: string;
  amountUsd: number;
  status: "pending" | "confirming" | "paid" | "expired" | "failed";
  provider: "demo" | "nowpayments";
  payUrl?: string;
  address?: string;
  createdAt: string;
  paidAt?: string;
  payCurrency?: string;
  payAmount?: string;
  txHash?: string;
  expiresAt?: string;
};