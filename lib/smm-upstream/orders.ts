import { getProviderSecret } from "@/lib/orbit/providers";
import { findUpstreamService } from "@/lib/smm-upstream/catalog";
import { panelPost } from "@/lib/smm-upstream/panel";
import { addNotification } from "@/lib/customer/panel-store";
import { listCustomers } from "@/lib/customer/user-store";
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

export function mapStatus(raw: string): DemoOrder["status"] | null {
  const key = raw.trim().toLowerCase();
  return STATUS_MAP[key] ?? null;
}

/**
 * Read the first useful value from a Server API answer. `cancel` and `refill` return a list
 * such as `[{order, cancel}]`; 0 or false means the request was refused.
 */
export function answerValue(
  result: { data: Record<string, unknown>; list?: Record<string, unknown>[] },
  field: string,
): unknown {
  const row = result.list?.[0];
  return row && field in row ? row[field] : result.data[field];
}

export function wasRefused(value: unknown) {
  return value === 0 || value === "0" || value === false;
}

function providerFor(order: DemoOrder) {
  const mapped = findUpstreamService(order.service);
  return mapped ? getProviderSecret(mapped.providerId) : null;
}

/** Tell the customer when their order changes, using only their own order number. */
async function notifyCustomer(order: DemoOrder, type: "order_completed" | "order_processing", body: string) {
  const owners = await listCustomers();
  const owner = owners.find((user) => user.apiKey === order.accountKey);
  if (!owner) return;
  await addNotification({
    userId: owner.id,
    type,
    title: `Order #${order.order} ${type === "order_completed" ? "completed" : "is in progress"}`,
    body,
    href: `/dashboard/orders/${order.order}`,
  });
}

/** Refresh one order from the provider. A canceled order refunds the wallet once. */
export async function syncOrderFromProvider(orderId: number) {
  const order = await getOrder(orderId);
  if (!order) return { error: "Order not found." as const };
  if (!order.upstreamOrderId) return { skipped: true as const, status: order.status };
  const provider = await providerFor(order);
  if (!provider?.apiKey.trim()) return { error: "Order updates are not connected." as const };
  const result = await panelPost(provider, { action: "status", order: order.upstreamOrderId });
  if (!result.ok) return { error: "The status could not be refreshed right now." as const };
  const payload = result.data as { status?: string; remains?: string | number; start_count?: string | number };
  const next = mapStatus(String(payload.status ?? ""));
  if (!next) return { skipped: true as const, status: order.status };
  const remains = Number(payload.remains);

  if (next === "Canceled" || next === "Refunded") {
    const refunded = await refundOrder(order.order, "The order was cancelled. The charge was returned to the wallet.");
    if ("error" in refunded) {
      await updateOrderStatus(order.order, next, Number.isFinite(remains) ? remains : undefined);
      return { error: refunded.error, status: next };
    }
    return { status: refunded.order.status, refunded: true, balance: refunded.account.balance };
  }
  const updated = await updateOrderStatus(order.order, next, Number.isFinite(remains) ? remains : undefined);
  if (!updated) return { error: "Order could not be updated." as const };
  /* Notify only on a real change, so repeated refreshes do not stack messages. */
  if (updated.status !== order.status) {
    if (next === "Completed") await notifyCustomer(order, "order_completed", "The delivery finished. Open the order to see the final count.");
    else if (next === "In progress" || next === "Processing") await notifyCustomer(order, "order_processing", "The order started. Delivery progress is on the order page.");
  }
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
  if (!order.upstreamOrderId) return { error: "This order is still starting. Try again in a moment." as const };
  const provider = await providerFor(order);
  if (!provider?.apiKey.trim()) return { error: "Order updates are not connected." as const };
  const result = await panelPost(provider, { action: "cancel", orders: order.upstreamOrderId });
  if (!result.ok) return { error: "The cancel could not be sent right now. Try again in a moment." as const };
  /* `cancel` comes back as `[{order, cancel}]`; a value of 0 means it was refused. */
  const accepted = answerValue(result, "cancel");
  if (accepted !== undefined && wasRefused(accepted)) {
    return { error: "The cancel was refused. The order may already be in delivery." as const };
  }
  const refunded = await refundOrder(order.order, "Cancelled on request. The charge was returned to the wallet.");
  if ("error" in refunded) return { error: refunded.error };
  await notifyCustomer(order, "order_processing", "The cancel was accepted and the charge went back to your wallet.");
  return { status: refunded.order.status, balance: refunded.account.balance };
}

/** Ask the provider for a refill. The order stays with the provider. */
export async function refillOrderWithProvider(orderId: number) {
  const order = await getOrder(orderId);
  if (!order) return { error: "Order not found." as const };
  if (!order.upstreamOrderId) return { error: "This order is still starting. Try again in a moment." as const };
  const provider = await providerFor(order);
  if (!provider?.apiKey.trim()) return { error: "Order updates are not connected." as const };
  const result = await panelPost(provider, { action: "refill", order: order.upstreamOrderId });
  if (!result.ok) return { error: "The refill request could not be sent right now." as const };
  const answer = answerValue(result, "refill");
  if (answer !== undefined && wasRefused(answer)) {
    return { error: "The refill was refused. This service may not support refills." as const };
  }
  return { ok: true as const, refillId: answer != null ? String(answer) : null };
}
