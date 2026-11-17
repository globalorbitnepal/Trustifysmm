import { NextResponse } from "next/server";
import { deleteRedirect, listRedirects, saveRedirect } from "@/lib/orbit/redirects";
import { listAdminActions } from "@/lib/orbit/audit";
import { recordAdminAction } from "@/lib/orbit/audit";
import { publicManagedPosts } from "@/lib/orbit/blog-store";
import { getBlogSlugs } from "@/data/blog-utils";

export const dynamic = "force-dynamic";

const pages = ["/", "/services", "/pricing", "/api", "/blogs", "/support", "/terms", "/privacy", "/signin", "/signup"];

export async function GET() {
  const slugs = [...getBlogSlugs(), ...publicManagedPosts().map((post) => post.slug)];
  return NextResponse.json({
    urls: [...pages, ...[...new Set(slugs)].map((slug) => `/blogs/${slug}`)],
    redirects: await listRedirects(),
    activity: await listAdminActions(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string; id?: string; from?: string; to?: string; enabled?: boolean };
  if (body.action === "delete") {
    const saved = await deleteRedirect(body.id || "");
    await recordAdminAction("redirect.delete", body.id || "");
    return NextResponse.json(saved);
  }
  const saved = await saveRedirect(body);
  if ("error" in saved) return NextResponse.json(saved, { status: 400 });
  await recordAdminAction("redirect.save", `${body.from} → ${body.to}`);
  return NextResponse.json(saved);
}
