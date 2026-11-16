import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { PricingOverridesFile } from "@/lib/orbit/pricing-display";
import { clearPricingOverridesCache } from "@/lib/orbit/pricing-display";

const OVERRIDES_PATH = path.join(process.cwd(), "data", "orbit", "pricing-overrides.json");

export async function readPricingOverrides(): Promise<PricingOverridesFile> {
  try {
    const raw = await readFile(OVERRIDES_PATH, "utf8");
    return JSON.parse(raw) as PricingOverridesFile;
  } catch {
    return { overrides: {} };
  }
}

export async function writePricingOverrides(data: PricingOverridesFile) {
  await mkdir(path.dirname(OVERRIDES_PATH), { recursive: true });
  await writeFile(OVERRIDES_PATH, JSON.stringify(data, null, 2), "utf8");
  clearPricingOverridesCache();
}