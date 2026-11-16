import type { SmmApiParams } from "@/lib/smm-api/types";

export function upstreamConfigured() {
  return Boolean(process.env.SMM_UPSTREAM_API_URL?.trim());
}

export async function proxyToUpstream(params: SmmApiParams): Promise<unknown> {
  const url = process.env.SMM_UPSTREAM_API_URL!.trim();
  const body = new URLSearchParams(params);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || "Upstream panel returned non-JSON response." };
  }
}