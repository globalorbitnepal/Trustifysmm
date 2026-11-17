import type { MetadataRoute } from "next";
import { liveSiteConfig } from "@/lib/orbit/live-catalog";

export default function robots(): MetadataRoute.Robots {
  const seo = liveSiteConfig().seo;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: seo.disallow?.length ? seo.disallow : ["/orbit", "/dashboard", "/api"],
    },
    sitemap: "https://trustifysmm.com/sitemap.xml",
    host: "https://trustifysmm.com",
  };
}
