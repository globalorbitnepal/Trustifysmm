import { NextResponse } from "next/server";
import { listProviders, saveProvider, testProvider } from "@/lib/orbit/providers";
import { recordAdminAction } from "@/lib/orbit/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ providers: await listProviders() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; id?: string; name?: string; endpoint?: string; apiKey?: string; enabled?: boolean; priority?: number };
  if (body.action === "test" && body.id) {
    const result = await testProvider(body.id);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    await recordAdminAction("provider.test", body.id);
    return NextResponse.json(result);
  }
  const saved = await saveProvider(body);
  if ("error" in saved) return NextResponse.json(saved, { status: 400 });
  await recordAdminAction("provider.save", saved.provider.name);
  return NextResponse.json(saved);
}
