import type { Metadata } from "next";
import { readSiteConfig } from "@/lib/orbit/site-config";
import { getSiteConfigSync } from "@/lib/orbit/site-config-sync";

export async function metadataForPath(path: string, fallback: Metadata): Promise<Metadata> {
  const config = await readSiteConfig();
  const row = config.pages[path];
  if (!row) return fallback;
  return {
    ...fallback,
    title: row.title,
    description: row.description,
    keywords: row.keywords.split(",").map((s) => s.trim()).filter(Boolean),
  };
}

export function metadataForPathSync(path: string, fallback: Metadata): Metadata {
  const row = getSiteConfigSync().pages[path];
  if (!row) return fallback;
  return {
    ...fallback,
    title: row.title,
    description: row.description,
    keywords: row.keywords.split(",").map((s) => s.trim()).filter(Boolean),
  };
}