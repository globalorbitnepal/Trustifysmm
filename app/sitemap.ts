import type { MetadataRoute } from "next";
import { getBlogSlugs } from "@/data/blog-utils";
import { publicManagedPosts } from "@/lib/orbit/blog-store";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/services", "/pricing", "/api", "/platforms", "/how-it-works", "/reviews", "/blogs", "/support", "/terms", "/privacy"];
  const slugs = new Set([...getBlogSlugs(), ...publicManagedPosts().map((post) => post.slug)]);
  return [
    ...pages.map((page) => ({
      url: `https://trustifysmm.com${page || "/"}`,
      lastModified: now,
    })),
    ...[...slugs].map((slug) => ({
      url: `https://trustifysmm.com/blogs/${slug}`,
      lastModified: now,
    })),
  ];
}
