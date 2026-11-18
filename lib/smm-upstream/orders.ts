import { getProviderSecret } from "@/lib/orbit/providers";
import { findUpstreamService } from "@/lib/smm-upstream/catalog";
import { panelPost } from "@/lib/smm-upstream/panel";
import { getOrder, listAllOrders, refundOrder, updateOrderStatus } from "@/lib/smm-api/demo-store";
import type { DemoOrder } from "@/lib/smm-api/types";

const STATUS_MAP: Record<string, DemoOrder["status"]> = {
  pending: "Pending",
  "in progress": "In progress",
  inprogress: "In progress",
  processing: "Processing",
  completed: "Completed",
  partial: "Partial",
  canceled: "Canceled",
  cancelled: "Canceled",
  refunded: "Refunded",
  failed: "Canceled",
};

function mapStatus(raw: string): DemoOrder["status"] | null {
  const key = raw.trim().toLowerCase();
  return STATUS_MAP[key] ?? null;
}

function providerFor(order: DemoOrder) {
  const mapped = findUpstreamService(order.service);
  return mapped ? getProviderSecret(mapped.providerId) : null;
}

/** Refresh one order from the provider. A canceled order refunds the wallet once. */
export async function syncOrderFromProvider(orderId: number) {
  const order = await getOrder(orderId);
  if (!order) return { error: "Order not found." as const };
  if (!order.upstreamOrderId) return { skipped: true as const, status: order.status };
  const provider = await providerFor(order);
  if (!provider?.apiKey.trim()) return { error: "Server API is not connected." as const };
  const result = await panelPost(provider, { action: "status", order: order.upstreamOrderId });
  if (!result.ok) return { error: result.error };
  const payload = result.data as { status?: string; remains?: string | number; start_count?: string | number };
  const next = mapStatus(String(payload.status ?? ""));
  if (!next) return { skipped: true as const, status: order.status };
  const remains = Number(payload.remains);

  if (next === "Canceled" || next === "Refunded") {
    const refunded = await refundOrder(order.order, `Server API reported ${payload.status}. Automatic refund.`);
    if ("error" in refunded) {
      await updateOrderStatus(order.order, next, Number.isFinite(remains) ? remains : undefined);
      return { error: refunded.error, status: next };
    }
    return { status: refunded.order.status, refunded: true, balance: refunded.account.balance };
  }

  const updated = await updateOrderStatus(order.order, next, Number.isFinite(remains) ? remains : undefined);
  if (!updated) return { error: "Order could not be updated." as const };
  return { status: updated.status, refunded: false };
}

/** Refresh open provider orders. Safe to call from a schedule or an admin refresh. */
export async function syncOpenOrders(limit = 40) {
  const orders = (await listAllOrders()).filter((order) => order.upstreamOrderId).slice(0, limit);
  const results: { id: number; status: string; refunded?: boolean; error?: string }[] = [];
  for (const order of orders) {
    if (order.status === "Completed" || order.status === "Canceled" || order.status === "Refunded") continue;
    const synced = await syncOrderFromProvider(order.order);
    if ("error" in synced) results.push({ id: order.order, status: order.status, error: synced.error });
    else if ("status" in synced) results.push({ id: order.order, status: String(synced.status), refunded: Boolean(synced.refunded) });
  }
  return results;
}

/** Ask the provider to cancel, then refund the customer from the provider's answer. */
export async function cancelOrderWithProvider(orderId: number) {
  const order = await getOrder(orderId);
  if (!order) return { error: "Order not found." as const };
  if (order.status === "Canceled" || order.status === "Refunded") return { error: "This order is already cancelled." as const };
  if (!order.upstreamOrderId) return { error: "This order has no Server API reference yet." as const };
  const provider = await providerFor(order);
  if (!provider?.apiKey.trim()) return { error: "Server API is not connected." as const };
  const result = await panelPost(provider, { action: "cancel", orders: order.upstreamOrderId });
  if (!result.ok) return { error: result.error };
  const accepted = (result.data as { cancel?: unknown }).cancel;
  if (accepted !== undefined && !accepted) {
    return { error: "The provider refused the cancel for this order." as const };
  }
  const refunded = await refundOrder(order.order, "Cancelled at the Server API. Customer refunded.");
  if ("error" in refunded) return { error: refunded.error };
  return { status: refunded.order.status, balance: refunded.account.balance };
}

/** Ask the provider for a refill. The order stays with the provider. */
export async function refillOrderWithProvider(orderId: number) {
  const order = await getOrder(orderId);
  if (!order) return { error: "Order not found." as const };
  if (!order.upstreamOrderId) return { error: "This order has no Server API reference yet." as const };
  const provider = await providerFor(order);
  if (!provider?.apiKey.trim()) return { error: "Server API is not connected." as const };
  const result = await panelPost(provider, { action: "refill", order: order.upstreamOrderId });
  if (!result.ok) return { error: result.error };
  const refill = (result.data as { refill?: unknown }).refill;
  return { ok: true as const, refillId: refill != null ? String(refill) : null };
}
