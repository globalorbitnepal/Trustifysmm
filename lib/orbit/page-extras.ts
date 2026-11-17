import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { defaultPageExtras } from "@/lib/orbit/page-defaults";
import type { AuthPageCopy, PageExtras } from "@/lib/orbit/types";

export function pageExtras(path: string): PageExtras {
  const site = liveSiteConfig();
  return site.pageExtras?.[path] ?? defaultPageExtras[path] ?? {};
}

export function authCopy(path: string): AuthPageCopy | undefined {
  return pageExtras(path).auth;
}