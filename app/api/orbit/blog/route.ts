import { NextResponse } from "next/server";
import { deleteManagedPost, readManagedPostsSync, saveManagedPost } from "@/lib/orbit/blog-store";
import { recordAdminAction } from "@/lib/orbit/audit";
import { getAllBlogPosts } from "@/data/blog-utils";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const managed = readManagedPostsSync();
  const builtIn = getAllBlogPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    status: "published" as const,
    category: post.category,
    publishedAt: post.publishedAt,
    source: "built-in" as const,
  }));
  return NextResponse.json({
    posts: [
      ...managed.map((post) => ({ ...post, source: "orbit" as const })),
      ...builtIn.filter((post) => !managed.some((row) => row.slug === post.slug)),
    ],
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.action === "delete") {
    await deleteManagedPost(String(body.slug || ""));
    await recordAdminAction("blog.delete", String(body.slug || ""));
    revalidatePath("/blogs");
    return NextResponse.json({ ok: true });
  }
  const keywords = String(body.focusKeywords || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const tags = String(body.tags || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const saved = await saveManagedPost({
    title: String(body.title || ""),
    slug: String(body.slug || ""),
    excerpt: String(body.excerpt || ""),
    body: String(body.body || ""),
    metaTitle: String(body.metaTitle || ""),
    metaDescription: String(body.metaDescription || ""),
    focusKeywords: keywords,
    category: String(body.category || "Guides"),
    author: String(body.author || "TrustifySMM"),
    status: body.status === "published" || body.status === "scheduled" ? body.status : "draft",
    publishedAt: String(body.publishedAt || new Date().toISOString()),
    tags,
    image: body.image ? { src: String(body.image), alt: String(body.title || "Blog") } : undefined,
  });
  if ("error" in saved) return NextResponse.json(saved, { status: 400 });
  await recordAdminAction("blog.save", saved.post.slug);
  revalidatePath("/blogs");
  revalidatePath(`/blogs/${saved.post.slug}`);
  return NextResponse.json(saved);
}
