import type { NextRequest } from "next/server";
import type { SmmApiParams } from "@/lib/smm-api/types";

export async function parseSmmApiRequest(request: NextRequest): Promise<SmmApiParams> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      const out: SmmApiParams = {};
      for (const [k, v] of Object.entries(body)) {
        if (v === null || v === undefined) continue;
        out[k] = String(v);
      }
      return out;
    } catch {
      return {};
    }
  }

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const out: SmmApiParams = {};
    form.forEach((value, key) => {
      out[key] = String(value);
    });
    return out;
  }

  const url = new URL(request.url);
  const out: SmmApiParams = {};
  url.searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}