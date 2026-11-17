import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BlogPost } from "@/data/blog-types";

export type ManagedPost = BlogPost & {
  status: "draft" | "published" | "scheduled";
  tags: string[];
};

const FILE = path.join(process.cwd(), "data", "runtime", "blog-posts.json");

function empty() {
  return [] as ManagedPost[];
}

export function readManagedPostsSync(): ManagedPost[] {
  try {
    if (!existsSync(FILE)) return empty();
    const rows = JSON.parse(readFileSync(FILE, "utf8")) as ManagedPost[];
    return Array.isArray(rows) ? rows : empty();
  } catch {
    return empty();
  }
}

async function writePosts(rows: ManagedPost[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

export function publicManagedPosts(now = Date.now()) {
  return readManagedPostsSync().filter((post) => {
    if (post.status === "draft") return false;
    if (post.status === "scheduled" && new Date(post.publishedAt).getTime() > now) return false;
    return post.status === "published" || post.status === "scheduled";
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function blocksFromText(text: string): BlogPost["blocks"] {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("## ")) {
        const textValue = part.slice(3).trim();
        return { type: "h2" as const, id: slugify(textValue), text: textValue };
      }
      if (part.startsWith("- ")) {
        return { type: "ul" as const, items: part.split("\n").map((line) => line.replace(/^- /, "").trim()).filter(Boolean) };
      }
      return { type: "p" as const, text: part };
    });
}

export async function saveManagedPost(input: Partial<ManagedPost> & { body?: string }) {
  const rows = readManagedPostsSync();
  const title = input.title?.trim() || "";
  if (title.length < 3) return { error: "Title is required." as const };
  const slug = slugify(input.slug || title);
  if (!slug) return { error: "Slug is required." as const };
  const now = new Date().toISOString();
  const existing = rows.find((post) => post.slug === (input.slug || slug) || post.slug === slug);
  const next: ManagedPost = {
    slug,
    title,
    metaTitle: input.metaTitle?.trim() || title,
    metaDescription: input.metaDescription?.trim() || input.excerpt?.trim() || title,
    focusKeywords: input.focusKeywords ?? [],
    excerpt: input.excerpt?.trim() || "",
    publishedAt: input.publishedAt || now,
    updatedAt: now,
    author: input.author?.trim() || "TrustifySMM",
    readMinutes: 8,
    category: input.category?.trim() || "Guides",
    image: input.image?.src ? input.image : { src: "/brand/logo-official-clean.png", alt: title },
    blocks: input.body !== undefined ? blocksFromText(input.body) : existing?.blocks ?? [],
    faq: input.faq ?? existing?.faq ?? [],
    status: input.status || existing?.status || "draft",
    tags: input.tags ?? existing?.tags ?? [],
  };
  const words = next.blocks.reduce((sum, block) => sum + ("text" in block ? block.text.split(/\s+/).length : 0), 0);
  next.readMinutes = Math.max(1, Math.round(words / 220));
  const without = rows.filter((post) => post.slug !== existing?.slug && post.slug !== slug);
  without.unshift(next);
  await writePosts(without);
  return { post: next };
}

export async function deleteManagedPost(slug: string) {
  const rows = readManagedPostsSync().filter((post) => post.slug !== slug);
  await writePosts(rows);
  return { ok: true };
}
