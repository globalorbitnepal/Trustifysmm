import { randomBytes } from "node:crypto";
import { addNotification } from "@/lib/customer/panel-store";
import type { CustomerUser } from "@/lib/customer/types";
import { chargeFor, findService, parseLimit, validTargetUrl } from "@/lib/dashboard/catalog";
import { placeOrdersAtomic, refundOrder } from "@/lib/smm-api/demo-store";
import { forwardOrderToServer } from "@/lib/smm-upstream/forward";

const hits = new Map<string, number[]>();

function rateLimit(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((stamp) => now - stamp < 60_000);
  if (recent.length >= 30) return false;
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

export type OrderRowInput = { serviceId: number; link: string; quantity: number };

export async function placeCustomerOrders(user: CustomerUser, rows: OrderRowInput[], idempotencyKey: string) {
  if (!rateLimit(user.id)) return { error: "Too many order attempts. Wait a minute and try again.", status: 429 };
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 80) {
    return { error: "Missing idempotency key.", status: 400 };
  }
  if (rows.length < 1 || rows.length > 50) return { error: "Submit between 1 and 50 orders.", status: 400 };
  if (user.apiKeyRevoked) return { error: "Your API key is revoked. Generate a new key before ordering.", status: 403 };

  const priced: { service: number; link: string; quantity: number; charge: number; platform: string; name: string }[] = [];
  for (const row of rows) {
    const service = findService(row.serviceId);
    if (!service) return { error: `Service ${row.serviceId} is not available.`, status: 400 };
    const min = parseLimit(service.minOrder);
    const max = parseLimit(service.maxOrder);
    if (!Number.isInteger(row.quantity) || row.quantity < min || row.quantity > max) {
      return { error: `Quantity for service ${service.id} must be between ${min} and ${max}.`, status: 400 };
    }
    const link = row.link.trim();
    if (!validTargetUrl(link)) return { error: "Each target must be a valid http or https URL.", status: 400 };
    priced.push({
      service: service.id,
      link,
      quantity: row.quantity,
      charge: chargeFor(service, row.quantity),
      platform: service.platform,
      name: service.name,
    });
  }

  const placed = await placeOrdersAtomic({
    key: user.apiKey,
    idempotencyKey,
    rows: priced.map(({ service, link, quantity, charge }) => ({ service, link, quantity, charge })),
  });
  if ("error" in placed) return { error: placed.error, status: 400 };

  if (!placed.replay) {
    for (const order of placed.orders) {
      const forwarded = await forwardOrderToServer(order);
      if ("error" in forwarded && forwarded.error) {
        await refundOrder(order.order, `Server API rejected order #${order.order}. ${forwarded.error}`);
        return { error: forwarded.error, status: 502 };
      }
      const meta = priced.find((row) => row.service === order.service && row.link === order.link);
      await addNotification({
        userId: user.id,
        type: "order_created",
        title: `Order #${order.order} placed`,
        body: meta ? meta.name : `Service ${order.service}`,
        href: `/dashboard/orders/${order.order}`,
      });
    }
  }

  return {
    orders: placed.orders.map((order) => ({
      id: order.order,
      service: order.service,
      link: order.link,
      quantity: order.quantity,
      charge: order.charge,
      status: order.status,
    })),
    balance: placed.balance,
    replay: placed.replay,
  };
}

export function newIdempotencyKey() {
  return randomBytes(16).toString("hex");
}
