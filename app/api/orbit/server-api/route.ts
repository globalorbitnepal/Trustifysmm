import { NextResponse } from "next/server";
import { recordAdminAction } from "@/lib/orbit/audit";
import { getProviderSecret, listProviderSecrets, saveProvider, testProvider } from "@/lib/orbit/providers";
import { serverApiSummary, syncProviderCatalog } from "@/lib/smm-upstream/catalog";
import { panelPost } from "@/lib/smm-upstream/panel";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await serverApiSummary());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    id?: string;
    name?: string;
    endpoint?: string;
    apiKey?: string;
    markupPercent?: number;
  };

  if (body.action === "save") {
    const saved = await saveProvider({
      id: body.id,
      name: body.name?.trim() || "HonestSMM",
      endpoint: body.endpoint?.trim() || "https://honestsmm.com/api/v2",
      apiKey: body.apiKey,
      markupPercent: body.markupPercent ?? 35,
      enabled: true,
    });
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("server-api.save", saved.provider.name);
    return NextResponse.json(await serverApiSummary());
  }

  const id = body.id || (await serverApiSummary()).provider?.id;
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
