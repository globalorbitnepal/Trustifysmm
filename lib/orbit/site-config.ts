import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { OrbitSiteConfig } from "@/lib/orbit/types";
import { defaultSiteConfig, mergeSiteConfig } from "@/lib/orbit/site-config-sync";

const CONFIG_PATH = path.join(process.cwd(), "data", "orbit", "site-config.json");

export { getSiteConfigSync } from "@/lib/orbit/site-config-sync";

export async function readSiteConfig(): Promise<OrbitSiteConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as OrbitSiteConfig;
    return mergeSiteConfig(parsed);
  } catch {
    return defaultSiteConfig;
  }
}

export async function writeSiteConfig(config: OrbitSiteConfig) {
  await mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  const next = { ...config, updatedAt: new Date().toISOString() };
  await writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}