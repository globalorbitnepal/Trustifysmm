import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import pricingData from "@/data/service-pricing.json";
import type { ServicePricingData } from "@/data/service-pricing-types";
import { effectiveRatePer1000 } from "@/lib/orbit/pricing-display";
import { readPricingOverrides, writePricingOverrides } from "@/lib/orbit/pricing-overrides-server";
import { readSiteConfig, writeSiteConfig } from "@/lib/orbit/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const catalog = pricingData as ServicePricingData;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(80, Math.max(20, Number(url.searchParams.get("pageSize") ?? "50")));

  let list = catalog.services;
  if (q) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        s.platform.includes(q),
    );
  }

  const total = list.length;
  const slice = list.slice((page - 1) * pageSize, page * pageSize);
  const config = await readSiteConfig();
  const overrides = await readPricingOverrides();

  return NextResponse.json({
    total,
    page,
    pageSize,
    globalMarkupPercent: config.pricing.globalMarkupPercent,
    overrideCount: Object.keys(overrides.overrides).length,
    items: slice.map((s) => ({
      id: s.id,
      name: s.name,
      platform: s.platform,
      group: s.group,
      baseRate: s.ratePer1000,
      rate: effectiveRatePer1000(s),
      overridden: overrides.overrides[String(s.id)] !== undefined,
    })),
  });
}

export async function PATCH(request: NextRequest) {
  let body: {
    serviceId?: number;
    rate?: number;
    globalMarkupPercent?: number;
    resetId?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const overrides = await readPricingOverrides();

  if (body.globalMarkupPercent !== undefined) {
    const config = await readSiteConfig();
    config.pricing.globalMarkupPercent = Number(body.globalMarkupPercent) || 0;
    await writeSiteConfig(config);
  }

  if (body.resetId !== undefined) {
    delete overrides.overrides[String(body.resetId)];
    await writePricingOverrides(overrides);
  }

  if (body.serviceId !== undefined && body.rate !== undefined) {
    const rate = Number(body.rate);
    if (!Number.isFinite(rate) || rate < 0) {
      return NextResponse.json({ error: "Invalid rate" }, { status: 400 });
    }
    overrides.overrides[String(body.serviceId)] = rate;
    await writePricingOverrides(overrides);
  }

  revalidatePath("/services");
  revalidatePath("/pricing");
  revalidatePath("/");

  return NextResponse.json({ ok: true, overrides: overrides.overrides });
}