import { NextResponse } from "next/server";
import { recordAdminAction } from "@/lib/orbit/audit";
import { readPricingOverrides, writePricingOverrides } from "@/lib/orbit/pricing-overrides-server";
import { readSiteConfig, writeSiteConfig } from "@/lib/orbit/site-config";
import {
  createCustomService,
  deleteCategory,
  duplicateService,
  listCategoryRows,
  readServiceAdminSync,
  saveCategory,
  setServiceHidden,
  updateCustomService,
  baseService,
} from "@/lib/orbit/service-admin";
import { livePricingData } from "@/lib/orbit/live-catalog";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = 40;
  const catalog = livePricingData();
  const admin = readServiceAdminSync();
  const overrides = await readPricingOverrides();
  const config = await readSiteConfig();
  let rows = catalog.services.map((service) => {
    const custom = admin.custom.find((row) => row.id === service.id);
    const cost = custom?.costPer1000;
    return {
      id: service.id,
      name: service.name,
      platform: service.platform,
      group: service.group,
      rate: service.ratePer1000,
      editRate: overrides.overrides[String(service.id)] ?? custom?.ratePer1000 ?? baseService(service.id)?.ratePer1000 ?? service.ratePer1000,
      cost: cost ?? null,
      margin: cost !== undefined ? Math.round((service.ratePer1000 - cost) * 10000) / 10000 : null,
      min: service.minOrder,
      max: service.maxOrder,
      custom: Boolean(custom),
      overridden: overrides.overrides[String(service.id)] !== undefined,
      featured: Boolean(custom?.featured),
    };
  });
  if (q) rows = rows.filter((row) => `${row.id} ${row.name} ${row.group} ${row.platform}`.toLowerCase().includes(q));
  const total = rows.length;
  return NextResponse.json({
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    globalMarkupPercent: config.pricing.globalMarkupPercent,
    items: rows.slice((page - 1) * pageSize, page * pageSize),
    categories: listCategoryRows(admin),
    platforms: catalog.platforms.map((id) => ({ id, label: catalog.platformLabel[id] || id })),
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action = String(body.action || "");
  if (action === "category") {
    const saved = await saveCategory({
      id: body.id ? String(body.id) : undefined,
      name: String(body.name || ""),
      platform: String(body.platform || "other"),
      description: String(body.description || ""),
      active: body.active !== false,
      order: Number(body.order || 0),
    });
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("category.save", String(body.name || ""));
    return NextResponse.json(saved);
  }
  if (action === "delete-category") {
    const saved = await deleteCategory(String(body.id || ""));
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("category.delete", String(body.id));
    return NextResponse.json(saved);
  }
  if (action === "create") {
    const saved = await createCustomService(body as never);
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("service.create", saved.service.name);
    revalidatePath("/services");
    return NextResponse.json(saved);
  }
  if (action === "update") {
    const saved = await updateCustomService(Number(body.id), body as never);
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("service.update", String(body.id));
    revalidatePath("/services");
    return NextResponse.json(saved);
  }
  if (action === "duplicate") {
    const saved = await duplicateService(Number(body.id));
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("service.duplicate", String(body.id));
    return NextResponse.json(saved);
  }
  if (action === "hide" || action === "restore") {
    const saved = await setServiceHidden(Number(body.id), action === "hide");
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction(action === "hide" ? "service.hide" : "service.restore", String(body.id));
    revalidatePath("/services");
    return NextResponse.json(saved);
  }
  if (action === "bulk") {
    const percent = Number(body.percent);
    if (!Number.isFinite(percent)) return NextResponse.json({ error: "Percent is required." }, { status: 400 });
    const platform = String(body.platform || "");
    const group = String(body.group || "");
    const overrides = await readPricingOverrides();
    const admin = readServiceAdminSync();
    const catalog = livePricingData();
    let count = 0;
    for (const service of catalog.services) {
      if (platform && service.platform !== platform) continue;
      if (group && service.group !== group) continue;
      const custom = admin.custom.find((row) => row.id === service.id);
      const base = overrides.overrides[String(service.id)] ?? custom?.ratePer1000 ?? baseService(service.id)?.ratePer1000 ?? service.ratePer1000;
      const next = Math.round(base * (1 + percent / 100) * 10000) / 10000;
      if (next < 0) continue;
      overrides.overrides[String(service.id)] = next;
      count += 1;
    }
    await writePricingOverrides(overrides);
    await recordAdminAction("pricing.bulk", `${percent}% on ${count} services`);
    revalidatePath("/services");
    revalidatePath("/pricing");
    return NextResponse.json({ ok: true, count });
  }
  if (action === "markup") {
    const config = await readSiteConfig();
    config.pricing.globalMarkupPercent = Number(body.percent) || 0;
    await writeSiteConfig(config);
    await recordAdminAction("pricing.markup", `${config.pricing.globalMarkupPercent}%`);
    revalidatePath("/services");
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
