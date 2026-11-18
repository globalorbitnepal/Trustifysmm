import { findService, publicService } from "@/lib/dashboard/catalog";
import type { DemoOrder } from "@/lib/smm-api/types";

export function presentOrder(order: DemoOrder) {
  const service = findService(order.service);
  const reported = order.remains < order.quantity;
  const synced = Boolean(order.upstreamOrderId);
  return {
    id: order.order,
    upstreamOrderId: order.upstreamOrderId ?? null,
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
    refill: Boolean(service && /refill|365d|lifetime/i.test(`${service.name} ${service.description}`) && synced),
    cancel: Boolean(synced && order.status !== "Canceled" && order.status !== "Refunded"),
  };
}
