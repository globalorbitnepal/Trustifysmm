import { processNowPaymentsIpnPayload } from "@/lib/banker/handler";
import { loadNowPaymentsConfig } from "@/lib/nowpayments/config";
import { verifyNowPaymentsIpnSignature } from "@/lib/nowpayments/signature";

export async function handleNowPaymentsIpnRequest(rawBody: string, signatureHeader: string | null) {
  const cfg = loadNowPaymentsConfig();
  if (!cfg.ipnSecret) {
    return { status: 503, body: { error: "Webhook secret is not configured." } };
  }
  if (!verifyNowPaymentsIpnSignature(rawBody, signatureHeader, cfg.ipnSecret)) {
    return { status: 401, body: { error: "Invalid signature" } };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { status: 400, body: { error: "Invalid JSON" } };
  }

  const result = await processNowPaymentsIpnPayload(payload);
  return { status: 200, body: result };
}