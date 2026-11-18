import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * White-label guard.
 *
 * Everything a visitor can read — marketing copy, FAQ, blog content, the API docs page, the
 * customer dashboard wording, the catalogue — must never hint that another panel supplies the
 * services. Orbit's admin screens are allowed to name the connection; public pages are not.
 */

const PUBLIC_ROOTS = [
  "data",
  "lib/seo-long-pages.ts",
  "components/ApiDocumentation.tsx",
  /* Customer-facing dashboard text, assembled into the browser bundle. */
  "components/dashboard/OrderViews.tsx",
  "components/dashboard/ServiceCatalogUI.tsx",
  "components/dashboard/OverviewView.tsx",
  "components/dashboard/WalletViews.tsx",
  "components/ServicesPricingCatalog.tsx",
  "components/PricingCatalog.tsx",
];
const SKIP = new Set(["orbit", "runtime", "service-pricing.json", "service-pricing-types.ts"]);
const SKIP_FILES = new Set(["coinlogo.tsx"]);

const BANNED = /\bhonest\s*smm\b|\bhonestsmm\b|server\s*api|smm_upstream|upstream catalog|upstream panel|upstream production|upstream service|upstream timeout|wholesale rate|the provider accepts|to the provider\b/i;

function filesUnder(target: string): string[] {
  const full = path.join(process.cwd(), target);
  if (statSync(full).isFile()) return [full];
  const out: string[] = [];
  for (const entry of readdirSync(full)) {
    if (SKIP.has(entry) || SKIP_FILES.has(entry.toLowerCase())) continue;
    const next = path.join(full, entry);
    if (statSync(next).isDirectory()) {
      if (entry === "blog") continue;
      out.push(...filesUnder(path.relative(process.cwd(), next)));
      continue;
    }
    if (/\.(ts|tsx|json|md)$/.test(entry)) out.push(next);
  }
  return out;
}

describe("public content stays white-label", () => {
  it("never names the fulfilment connection", () => {
    const hits: string[] = [];
    for (const root of PUBLIC_ROOTS) {
      for (const file of filesUnder(root)) {
        const lines = readFileSync(file, "utf8").split("\n");
        lines.forEach((line, index) => {
          if (BANNED.test(line)) hits.push(`${path.relative(process.cwd(), file)}:${index + 1} ${line.trim().slice(0, 120)}`);
        });
      }
    }
    expect(hits).toEqual([]);
  });
});
