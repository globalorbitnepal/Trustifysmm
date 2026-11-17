import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { readSiteConfig, writeSiteConfig } from "@/lib/orbit/site-config";
import type { OrbitSiteConfig } from "@/lib/orbit/types";
import { clearPricingOverridesCache } from "@/lib/orbit/pricing-display";
import { clearLiveCatalogCache } from "@/lib/orbit/live-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await readSiteConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  let body: OrbitSiteConfig;
  try {
    body = (await request.json()) as OrbitSiteConfig;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const saved = await writeSiteConfig(body);
  clearPricingOverridesCache();
  clearLiveCatalogCache();

  for (const path of ["/", "/services", "/pricing", "/api", "/blogs", "/support", "/terms", "/privacy", "/signin", "/signup"]) {
    revalidatePath(path);
  }
  revalidatePath("/orbit");

  return NextResponse.json(saved);
}