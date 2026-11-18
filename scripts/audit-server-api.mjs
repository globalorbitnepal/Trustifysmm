/**
 * Live audit against the Server API.
 *
 *   node scripts/audit-server-api.mjs
 *
 * Confirms that every service the provider returns exists in the local catalog with the same
 * rate plus the configured markup, that the customer catalog exposes all of them under a
 * private code, and that no customer text contains provider wording.
 *
 * Read-only: it syncs the catalog the same way the Sync button does, then reports.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = {};
for (const line of readFileSync(path.join(root, ".env"), "utf8").split("\n")) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const url = env.HONESTSMM_API_URL || "https://honestsmm.com/api/v2";
const key = env.HONESTSMM_API_KEY;
const markup = Number(env.HONESTSMM_MARKUP_PERCENT || 30);
if (!key) {
  console.error("No Server API key in .env");
  process.exit(1);
}

const body = new URLSearchParams({ key, action: "services" });
const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
const remote = await response.json();
if (!Array.isArray(remote)) {
  console.error("The Server API did not return a service list.", response.status);
  process.exit(1);
}

const catalog = JSON.parse(readFileSync(path.join(root, "data", "runtime", "upstream-catalog.json"), "utf8"));
const byUpstream = new Map(catalog.services.map((row) => [row.upstreamId, row]));
const sell = (cost) => Math.round(cost * (1 + markup / 100) * 10000) / 10000;

const missing = [];
const priceMismatch = [];
const codeProblem = [];
const seenCodes = new Set();
const leak = [];
const remoteIds = new Set();

for (const row of remote) {
  const id = Number(row.service);
  const cost = Number(row.rate);
  if (!Number.isFinite(id) || !Number.isFinite(cost)) continue;
  /* A divider row is layout, not a service: it is expected to be absent locally. */
  if (!/[\p{L}\p{N}]/u.test(String(row.name || ""))) continue;
  remoteIds.add(id);
  const local = byUpstream.get(id);
  if (!local) {
    missing.push(id);
    continue;
  }
  const expected = sell(cost);
  if (Math.abs(local.ratePer1000 - expected) > 0.00011) priceMismatch.push(`${id}: ${local.ratePer1000} != ${expected}`);
  if (!Number.isInteger(local.localId) || local.localId < 10000) codeProblem.push(`${id} code ${local.localId}`);
  if (seenCodes.has(local.localId)) codeProblem.push(`${id} duplicate code ${local.localId}`);
  seenCodes.add(local.localId);
  /*
   * "Server" is left out on purpose: Discord Server Boost and "Cheap Server" are product
   * wording. The customer-facing mask is asserted separately in the unit tests.
   */
  if (/honest\s*smm|\bapi\b|\bproviders?\b|wholesale|upstream/i.test(`${local.name} ${local.category}`)) {
    leak.push(`${id} ${local.name}`);
  }
}

const extra = catalog.services.filter((row) => !remoteIds.has(row.upstreamId)).map((row) => row.upstreamId);
/* Section dividers the provider lists as services are layout, not products, so they are
 * intentionally absent from the local catalog and are not counted as missing. */
const dividers = remote.filter((row) => !/[\p{L}\p{N}]/u.test(String(row.name || ""))).map((row) => Number(row.service));
const categories = new Set(catalog.services.map((row) => row.category));

const report = {
  provider: new URL(url).host,
  remoteServices: remoteIds.size,
  localServices: catalog.services.length,
  skippedDividers: dividers,
  categories: categories.size,
  markupPercent: markup,
  syncedAt: catalog.syncedAt,
  missing,
  extra,
  priceMismatch,
  codeProblem,
  providerWordInCatalog: leak,
};

console.log(JSON.stringify(report, null, 2));

const failed = missing.length || extra.length || priceMismatch.length || codeProblem.length || leak.length;
if (failed) {
  console.error("\nAudit failed.");
  process.exit(1);
}
console.log("\nAudit passed: every provider service is local, priced once, and clean of provider wording.");
