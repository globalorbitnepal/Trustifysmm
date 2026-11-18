import { recordApiActivity } from "@/lib/smm-api/activity";
import { livePricingData } from "@/lib/orbit/live-catalog";
import { findPricingService, panelChargeFor, pricingToApiServices } from "@/lib/smm-api/catalog";
import {
  createDemoOrder,
  getAccountByKey,
  getOrder,
  listOrdersForKey,
  refundOrder,
} from "@/lib/smm-api/demo-store";
import type { SmmApiParams } from "@/lib/smm-api/types";
import { getUserByApiKey } from "@/lib/customer/user-store";
import { findUpstreamService } from "@/lib/smm-upstream/catalog";
import { forwardOrderToServer } from "@/lib/smm-upstream/forward";
import { cancelOrderWithProvider, refillOrderWithProvider, syncOrderFromProvider } from "@/lib/smm-upstream/orders";

function parseIntSafe(value: string | undefined) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : NaN;
}

function orderPayload(order: Awaited<ReturnType<typeof getOrder>>) {
  if (!order) return { error: "Incorrect order ID" };
  return {
    charge: order.charge.toFixed(4),
    start_count: String(order.start_count),
    status: order.status,
    remains: String(order.remains),
    currency: order.currency,
  };
}

export type ApiCallMeta = { ip?: string };

/**
 * Standard panel API. The key is the customer's own key. The charge leaves that customer's
 * wallet, and the order is placed on the same catalog the dashboard sells.
 */
export async function handleSmmApi(params: SmmApiParams, meta: ApiCallMeta = {}): Promise<unknown> {
  const key = params.key?.trim() ?? "";
  const action = params.action?.trim().toLowerCase() ?? "";
  const ip = meta.ip || "unknown";

  if (!key) return finish(null, "", action || "missing", ip, false, "API key is required", null, { error: "API key is required" });
  if (!action) return finish(key, "", action, ip, false, "action is required", null, { error: "action is required" });

  const account = await getAccountByKey(key);
  if (!account || account.revoked) {
    return finish(key, "", action, ip, false, account?.revoked ? "API key is revoked" : "Invalid API key", null, {
      error: account?.revoked ? "API key is revoked" : "Invalid API key",
    });
  }
  const owner = await getUserByApiKey(key);

  switch (action) {
    case "services":
      return finish(key, owner?.email ?? account.email, action, ip, true, "Service list", null, pricingToApiServices(livePricingData()), owner?.id ?? null);

    case "balance":
      return finish(
        key,
        owner?.email ?? account.email,
        action,
        ip,
        true,
        account.balance.toFixed(4),
        null,
        { balance: account.balance.toFixed(4), currency: account.currency },
        owner?.id ?? null,
      );

    case "add":
      return addOrder(key, owner?.id ?? null, owner?.email ?? account.email, ip, params);

    case "status":
      return oneStatus(key, owner?.id ?? null, owner?.email ?? account.email, ip, params);

    case "multi_status":
      return manyStatus(key, owner?.id ?? null, owner?.email ?? account.email, ip, params);

    case "refill":
      return refill(key, owner?.id ?? null, owner?.email ?? account.email, ip, params);

    case "cancel":
      return cancel(key, owner?.id ?? null, owner?.email ?? account.email, ip, params);

    case "refill_status":
      return finish(key, owner?.email ?? account.email, action, ip, false, "Refill status is not available", null, {
        error: "Refill status is not available.",
      }, owner?.id ?? null);

    default:
      return finish(key, owner?.email ?? account.email, action, ip, false, "Unknown action", null, {
        error: "Unknown action",
      }, owner?.id ?? null);
  }
}

async function addOrder(key: string, userId: string | null, email: string, ip: string, params: SmmApiParams) {
  const serviceId = parseIntSafe(params.service);
  const link = params.link?.trim() ?? "";
  const mapped = Number.isFinite(serviceId) ? findUpstreamService(serviceId) : undefined;
  const quantity = mapped?.type === "Package" ? 1 : parseIntSafe(params.quantity);
  if (!Number.isFinite(serviceId) || !Number.isFinite(quantity) || !link) {
    return finish(key, email, "add", ip, false, "service, link and quantity are required", null, {
      error: "service, link and quantity are required",
    }, userId);
  }
  const svc = findPricingService(livePricingData(), serviceId);
  if (!svc) return finish(key, email, "add", ip, false, "Service not found", null, { error: "Service not found" }, userId);
  const min = Number.parseInt(svc.minOrder || "1", 10) || 1;
  const max = Number.parseInt(svc.maxOrder || "1000000", 10) || 1000000;
  if (mapped?.type !== "Package" && (quantity < min || quantity > max)) {
    return finish(key, email, "add", ip, false, `Quantity must be between ${min} and ${max}`, null, {
      error: `Quantity must be between ${min} and ${max}`,
    }, userId);
  }
  const charge = panelChargeFor(svc.ratePer1000, quantity);
  const result = await createDemoOrder({ key, service: serviceId, link, quantity, charge, channel: "api" });
  if ("error" in result) {
    return finish(key, email, "add", ip, false, result.error || "Order was not accepted", null, { error: result.error || "Order was not accepted" }, userId);
  }
  const forwarded = await forwardOrderToServer(result.order);
  if ("error" in forwarded && forwarded.error) {
    await refundOrder(result.order.order, `Order #${result.order.order} could not be started. Charge returned.`);
    return finish(key, email, "add", ip, false, forwarded.error, result.order.order, { error: forwarded.error }, userId);
  }
  return finish(
    key,
    email,
    "add",
    ip,
    true,
    `Order #${result.order.order} charged ${charge.toFixed(4)}`,
    result.order.order,
    { order: result.order.order },
    userId,
  );
}

async function oneStatus(key: string, userId: string | null, email: string, ip: string, params: SmmApiParams) {
  const orderId = parseIntSafe(params.order);
  if (!Number.isFinite(orderId)) {
    return finish(key, email, "status", ip, false, "order id is required", null, { error: "order id is required" }, userId);
  }
  const order = await ownedOrder(key, orderId);
  if (!order) return finish(key, email, "status", ip, false, "Incorrect order ID", orderId, { error: "Incorrect order ID" }, userId);
  if (order.upstreamOrderId && order.status !== "Completed" && order.status !== "Refunded" && order.status !== "Canceled") {
    await syncOrderFromProvider(order.order);
  }
  const fresh = await getOrder(order.order);
  return finish(key, email, "status", ip, true, fresh?.status || order.status, order.order, orderPayload(fresh), userId);
}

async function manyStatus(key: string, userId: string | null, email: string, ip: string, params: SmmApiParams) {
  const ids = (params.orders ?? "")
    .split(",")
    .map((part) => parseIntSafe(part.trim()))
    .filter((n) => Number.isFinite(n))
    .slice(0, 100);
  const orders = await listOrdersForKey(key, ids);
  const out: Record<string, ReturnType<typeof orderPayload>> = {};
  for (const order of orders) {
    if (order.upstreamOrderId && order.status !== "Completed" && order.status !== "Refunded" && order.status !== "Canceled") {
      await syncOrderFromProvider(order.order);
    }
    out[String(order.order)] = orderPayload(await getOrder(order.order));
  }
  for (const id of ids) {
    if (!out[String(id)]) out[String(id)] = { error: "Incorrect order ID" };
  }
  return finish(key, email, "multi_status", ip, true, `${ids.length} orders`, null, out, userId);
}

async function refill(key: string, userId: string | null, email: string, ip: string, params: SmmApiParams) {
  const orderId = parseIntSafe(params.order);
  const order = Number.isFinite(orderId) ? await ownedOrder(key, orderId) : null;
  if (!order) return finish(key, email, "refill", ip, false, "Incorrect order ID", orderId || null, { error: "Incorrect order ID" }, userId);
  const result = await refillOrderWithProvider(order.order);
  if ("error" in result) return finish(key, email, "refill", ip, false, result.error || "Refill was not accepted", order.order, { error: result.error || "Refill was not accepted" }, userId);
  return finish(key, email, "refill", ip, true, "Refill accepted", order.order, { refill: result.refillId || order.order }, userId);
}

async function cancel(key: string, userId: string | null, email: string, ip: string, params: SmmApiParams) {
  const raw = params.orders || params.order || "";
  const orderId = parseIntSafe(raw.split(",")[0]);
  const order = Number.isFinite(orderId) ? await ownedOrder(key, orderId) : null;
  if (!order) return finish(key, email, "cancel", ip, false, "Incorrect order ID", orderId || null, { error: "Incorrect order ID" }, userId);
  const result = await cancelOrderWithProvider(order.order);
  if ("error" in result) return finish(key, email, "cancel", ip, false, result.error || "Cancel was not accepted", order.order, { error: result.error || "Cancel was not accepted" }, userId);
  return finish(key, email, "cancel", ip, true, "Cancel accepted and wallet refunded", order.order, [{ order: order.order, cancel: 1 }], userId);
}

async function ownedOrder(key: string, orderId: number) {
  const order = await getOrder(orderId);
  if (!order?.accountKey || order.accountKey !== key) return null;
  return order;
}

async function finish(
  key: string | null,
  email: string,
  action: string,
  ip: string,
  ok: boolean,
  detail: string,
  orderId: number | null,
  body: unknown,
  userId: string | null = null,
) {
  if (key) {
    await recordApiActivity({
      userId,
      email: email || null,
      action: action || "unknown",
      ip,
      ok,
      detail,
      orderId,
      keyPrefix: key.slice(0, 8),
    });
  }
  return body;
}
