import { findService, publicService } from "@/lib/dashboard/catalog";
import type { DemoOrder } from "@/lib/smm-api/types";

export function presentOrder(order: DemoOrder) {
  const service = findService(order.service);
  const reported = order.remains < order.quantity;
  const routed = Boolean(order.upstreamOrderId);
  /*
   * Only the customer's own order number leaves this function. The reference used for the
   * fulfilment connection stays on the server so the order page cannot reveal it.
   */
  return {
    id: order.order,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? order.createdAt,
    serviceId: order.service,
    serviceName: service?.name ?? `Service ${order.service}`,
    platform: service?.platform ?? "other",
    platformLabel: service ? publicService(service).platformLabel : "Other",
    group: service?.group ?? "",
    link: order.link,
    quantity: order.quantity,
    charge: order.charge,
    status: order.status,
    remains: order.remains,
    startCount: order.start_count > 0 ? order.start_count : null,
    progress: reported ? Math.round(((order.quantity - order.remains) / order.quantity) * 100) : null,
    refill: Boolean(routed && (service?.refill || (service && /refill|365d|lifetime/i.test(`${service.name} ${service.description}`)))),
    cancel: Boolean(routed && order.status !== "Canceled" && order.status !== "Refunded"),
  };
}
