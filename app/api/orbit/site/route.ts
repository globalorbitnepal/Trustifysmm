import { NextResponse } from "next/server";
import { deleteRedirect, listRedirects, saveRedirect } from "@/lib/orbit/redirects";
import { listAdminActions } from "@/lib/orbit/audit";
import { recordAdminAction } from "@/lib/orbit/audit";
import { publicManagedPosts } from "@/lib/orbit/blog-store";
import { getBlogSlugs } from "@/data/blog-utils";
import { ALL_LANDING_PAGES } from "@/lib/seo/pages";
import { seoInventory, searchConsoleStatus } from "@/lib/seo/inventory";
import { SITE_URL } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

const pages = ["/", "/services", "/pricing", "/api", "/blogs", "/support", "/terms", "/privacy", "/signin", "/signup"];

export async function GET() {
  const slugs = [...getBlogSlugs(), ...publicManagedPosts().map((post) => post.slug)];
  const landing = ALL_LANDING_PAGES.map((page) => `/${page.slug}`);
  const sitemapUrls = [
    ...pages,
    ...landing,
    ...[...new Set(slugs)].map((slug) => `/blogs/${slug}`),
  ];
  return NextResponse.json({
    urls: sitemapUrls,
    sitemapUrl: `${SITE_URL}/sitemap.xml`,
    robotsUrl: `${SITE_URL}/robots.txt`,
    inventory: seoInventory(),
    searchConsole: searchConsoleStatus(),
    redirects: await listRedirects(),
    activity: await listAdminActions(),
  });
}
