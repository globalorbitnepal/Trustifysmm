import { livePricingData } from "@/lib/orbit/live-catalog";
import { findPricingService, pricingToApiServices } from "@/lib/smm-api/catalog";
import {
  createDemoOrder,
  getAccountByKey,
  getOrder,
  listOrdersForKey,
  refundOrder,
} from "@/lib/smm-api/demo-store";
import type { SmmApiParams } from "@/lib/smm-api/types";
import { proxyToUpstream, upstreamConfigured } from "@/lib/smm-api/upstream";
import { forwardOrderToServer } from "@/lib/smm-upstream/forward";

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

export async function handleSmmApi(params: SmmApiParams): Promise<unknown> {
  if (upstreamConfigured()) {
    return proxyToUpstream(params);
  }

  const key = params.key?.trim();
  const action = params.action?.trim().toLowerCase();

  if (!key) return { error: "API key is required" };
  if (!action) return { error: "action is required" };

  const account = await getAccountByKey(key);
  if (!account || account.revoked) return { error: "Invalid API key" };

  switch (action) {
    case "services":
      return pricingToApiServices(livePricingData());

    case "balance":
      return {
        balance: account.balance.toFixed(4),
        currency: account.currency,
      };

    case "add": {
      const serviceId = parseIntSafe(params.service);
      const quantity = parseIntSafe(params.quantity);
      const link = params.link?.trim();
      if (!Number.isFinite(serviceId) || !Number.isFinite(quantity) || !link) {
        return { error: "service, link and quantity are required" };
      }
      const svc = findPricingService(livePricingData(), serviceId);
      if (!svc) return { error: "Service not found" };
      const charge = (svc.ratePer1000 * quantity) / 1000;
      const result = await createDemoOrder({
        key,
        service: serviceId,
        link,
        quantity,
        charge,
      });
      if ("error" in result) return result;
      const forwarded = await forwardOrderToServer(result.order);
      if ("error" in forwarded && forwarded.error) {
        await refundOrder(result.order.order, `Server API rejected order #${result.order.order}. ${forwarded.error}`);
        return { error: forwarded.error };
      }
      return { order: result.order.order };
    }

    case "status": {
      const orderId = parseIntSafe(params.order);
      if (!Number.isFinite(orderId)) return { error: "order id is required" };
      const order = await getOrder(orderId);
      if (order?.accountKey && order.accountKey !== key) return { error: "Incorrect order ID" };
      return orderPayload(order);
    }

    case "multi_status": {
      const raw = params.orders ?? "";
      const ids = raw
        .split(",")
        .map((s) => parseIntSafe(s.trim()))
        .filter((n) => Number.isFinite(n));
      const orders = await listOrdersForKey(key, ids);
      const out: Record<string, ReturnType<typeof orderPayload>> = {};
      for (const o of orders) {
        out[String(o.order)] = orderPayload(o) as ReturnType<typeof orderPayload>;
      }
      return out;
    }

    case "refill":
      return { error: "Refill is not enabled on demo API. Connect SMM_UPSTREAM_API_URL for live panel." };

    case "refill_status":
      return { error: "Refill status is not enabled on demo API." };

    case "cancel":
      return { error: "Cancel is not enabled on demo API." };

    default:
      return { error: `Unknown action: ${action}` };
  }
}