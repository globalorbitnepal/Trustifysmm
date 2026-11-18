import type { ProviderRecord } from "@/lib/orbit/providers";

export type PanelResponse = Record<string, unknown> & { error?: string; order?: number | string };

/** Standard SMM panel v2 call. The key stays on the server and TLS is verified. */
export async function panelPost(provider: ProviderRecord, fields: Record<string, string>) {
  const body = new URLSearchParams({ key: provider.apiKey, ...fields });
  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const text = await response.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false as const, error: "The server API did not return JSON.", data: {} as PanelResponse };
  }
  const record = (data && typeof data === "object" ? data : {}) as PanelResponse;
  const error = typeof record.error === "string" ? record.error : "";
  if (!response.ok || error) {
    return { ok: false as const, error: error || `Server API returned ${response.status}.`, data: record };
  }
  return { ok: true as const, error: "", data: record };
}
