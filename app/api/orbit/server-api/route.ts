import { NextResponse } from "next/server";
import { recordAdminAction } from "@/lib/orbit/audit";
import { ensureHonestProvider, getProviderSecret, listProviderSecrets, saveProvider, testProvider } from "@/lib/orbit/providers";
import {
  repriceCatalog,
  serverApiSummary,
  setCategoryPrice,
  setServicePrice,
  syncProviderCatalog,
} from "@/lib/smm-upstream/catalog";
import { panelPost } from "@/lib/smm-upstream/panel";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureHonestProvider();
  const category = new URL(request.url).searchParams.get("category") || undefined;
  return NextResponse.json(await serverApiSummary(category));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    id?: string;
    name?: string;
    endpoint?: string;
    apiKey?: string;
    markupPercent?: number;
    localId?: number;
    category?: string;
    price?: number | string | null;
  };

  if (body.action === "save") {
    const saved = await saveProvider({
      id: body.id,
      name: body.name?.trim() || "HonestSMM",
      endpoint: body.endpoint?.trim() || "https://honestsmm.com/api/v2",
      apiKey: body.apiKey,
      markupPercent: body.markupPercent ?? 30,
      enabled: true,
    });
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    if (body.markupPercent !== undefined) {
      await repriceCatalog(Number(body.markupPercent) || 0);
      revalidatePath("/services");
      revalidatePath("/pricing");
    }
    await recordAdminAction("server-api.save", saved.provider.name);
    return NextResponse.json(await serverApiSummary());
  }

  if (body.action === "service-price") {
    const value = body.price === null || body.price === "" ? null : Number(body.price);
    const saved = await setServicePrice(Number(body.localId), value);
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("server-api.price", `${body.localId} → ${saved.row.ratePer1000}`);
    revalidatePath("/services");
    revalidatePath("/pricing");
    return NextResponse.json(await serverApiSummary(saved.row.category));
  }

  if (body.action === "category-price") {
    const value = body.price === null || body.price === "" ? null : Number(body.price);
    const saved = await setCategoryPrice(String(body.category || ""), value);
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("server-api.category-price", `${body.category} → ${value ?? "auto"}`);
    revalidatePath("/services");
    revalidatePath("/pricing");
    return NextResponse.json(await serverApiSummary(String(body.category || "")));
  }

  const ensured = await ensureHonestProvider();
  const id = body.id || ensured?.id || (await serverApiSummary()).provider?.id;
  if (!id) return NextResponse.json({ error: "Save the server API key first." }, { status: 400 });
  const provider = await getProviderSecret(id);
  if (!provider) return NextResponse.json({ error: "Server API was not found." }, { status: 404 });

  if (body.action === "balance") {
    const tested = await testProvider(id);
    const live = await panelPost(provider, { action: "balance" });
    const balance = live.ok ? String((live.data as { balance?: string }).balance ?? "") : "";
    const currency = live.ok ? String((live.data as { currency?: string }).currency ?? "") : "";
    return NextResponse.json({ ...tested, balance, currency, error: live.ok ? undefined : live.error });
  }

  if (body.action === "sync") {
    const synced = await syncProviderCatalog(provider);
    if ("error" in synced) return NextResponse.json(synced, { status: 502 });
    await recordAdminAction("server-api.sync", `${synced.services} services`);
    return NextResponse.json({ ...synced, ...(await serverApiSummary()) });
  }

  const known = await listProviderSecrets();
  return NextResponse.json({ error: "Unknown action.", providers: known.length }, { status: 400 });
}
