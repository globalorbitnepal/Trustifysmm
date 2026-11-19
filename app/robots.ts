import type { MetadataRoute } from "next";

/** Public routes only. Private app areas are also blocked here; noindex is added separately. */
const PUBLIC_DISALLOW: string[] = [];

/*
 * /signin and /signup are intentionally crawlable: their noindex meta tag can only
 * be read if the crawler is allowed to fetch the page. Blocking them here would hide
 * the directive and leave the URL eligible purely on external links.
 */
const PRIVATE_DISALLOW = [
  "/orbit",
  "/orbit/",
  "/dashboard",
  "/dashboard/",
  "/api/",
  "/account",
  "/checkout",
  "/payment",
  "/wallet",
  "/reset-password",
  "/forgot-password",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = [...PRIVATE_DISALLOW, ...PUBLIC_DISALLOW];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Explicitly allow crawling of assets that some crawlers block by default.
      { userAgent: "*", allow: ["/_next/static/", "/_next/image/", "/brand/", "/coins/", "/blogs/"] },
    ],
    sitemap: "https://trustifysmm.com/sitemap.xml",
    host: "https://trustifysmm.com",
  };
}
