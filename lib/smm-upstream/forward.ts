import { attachUpstreamOrder } from "@/lib/smm-api/demo-store";
import type { DemoOrder } from "@/lib/smm-api/types";
import { getProviderSecret } from "@/lib/orbit/providers";
import { findUpstreamService } from "@/lib/smm-upstream/catalog";
import { panelPost } from "@/lib/smm-upstream/panel";

/**
 * Send a charged local order to the Server API.
 * Services that are not from the synced catalog are left as local orders.
 */
export async function forwardOrderToServer(order: DemoOrder) {
  const mapped = findUpstreamService(order.service);
  if (!mapped) return { skipped: true as const };
  if (mapped.type !== "Default" && mapped.type !== "Package") {
    return { error: `This ${mapped.type} service cannot be placed from the standard order form.` };
  }
  const provider = await getProviderSecret(mapped.providerId);
  if (!provider?.enabled || !provider.apiKey.trim()) {
    return { error: "Server API is not connected. The order was not sent." };
  }
  const fields: Record<string, string> = {
    action: "add",
    service: String(mapped.upstreamId),
    link: order.link,
  };
  if (mapped.type !== "Package") fields.quantity = String(order.quantity);
  const result = await panelPost(provider, fields);
  const upstreamId = result.data.order != null ? String(result.data.order) : "";
  if (!result.ok || !upstreamId) {
    return { error: result.error || "The server API did not accept the order." };
  }
  await attachUpstreamOrder(order.order, upstreamId, mapped.upstreamId);
  return { skipped: false as const, upstreamOrderId: upstreamId };
}
