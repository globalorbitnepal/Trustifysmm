import { NextResponse } from "next/server";
import { deleteMedia, listMedia, saveMedia } from "@/lib/orbit/media-store";
import { recordAdminAction } from "@/lib/orbit/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ items: await listMedia() });
}

export async function POST(request: Request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const body = (await request.json()) as { id?: string };
    const saved = await deleteMedia(body.id || "");
    if ("error" in saved) return NextResponse.json(saved, { status: 400 });
    await recordAdminAction("media.delete", body.id || "");
    return NextResponse.json(saved);
  }
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  const saved = await saveMedia(file, String(form.get("alt") || ""));
  if ("error" in saved) return NextResponse.json(saved, { status: 400 });
  await recordAdminAction("media.upload", saved.item.url);
  return NextResponse.json(saved);
}
