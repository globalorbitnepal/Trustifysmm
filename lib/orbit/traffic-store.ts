import { appendFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type TrafficHit = {
  t: number;
  path: string;
  source: string;
  host: string;
  sid: string;
  /** ISO 3166-1 alpha-2 country code from the CDN edge, never a raw IP. */
  country?: string;
};

const FILE = path.join(process.cwd(), "data", "orbit", "traffic.jsonl");
const MAX_BYTES = 6_000_000;

export function classifySource(referrer: string, utm: string) {
  const raw = (utm || referrer || "").trim().toLowerCase();
  if (!raw) return { source: "Direct", host: "" };
  let host = raw;
  try {
    host = new URL(raw.startsWith("http") ? raw : `https://${host}`).hostname.replace(/^www\./, "");
  } catch {
    host = raw.replace(/^https?:\/\//, "").split("/")[0];
  }
  if (host.includes("google")) return { source: "Google", host };
  if (host.includes("bing") || host.includes("yahoo") || host.includes("duckduckgo")) return { source: "Search", host };
  if (host.includes("facebook") || host.includes("fb.")) return { source: "Facebook", host };
  if (host.includes("instagram")) return { source: "Instagram", host };
  if (host.includes("tiktok")) return { source: "TikTok", host };
  if (host.includes("youtube") || host.includes("youtu.be")) return { source: "YouTube", host };
  if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com")) return { source: "X / Twitter", host };
  if (host.includes("telegram") || host.includes("t.me")) return { source: "Telegram", host };
  if (host.includes("linkedin")) return { source: "LinkedIn", host };
  if (host.includes("trustifysmm")) return { source: "Internal", host };
  return { source: host || "Referral", host };
}

/** Country names for the codes we are most likely to see, so the admin reads them. */
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  ES: "Spain",
  IT: "Italy",
  IE: "Ireland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  PT: "Portugal",
  BE: "Belgium",
  AT: "Austria",
  CH: "Switzerland",
  IN: "India",
  NP: "Nepal",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  TR: "Turkey",
  BR: "Brazil",
  MX: "Mexico",
  AR: "Argentina",
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  EG: "Egypt",
  ID: "Indonesia",
  MY: "Malaysia",
  SG: "Singapore",
  PH: "Philippines",
  TH: "Thailand",
  VN: "Vietnam",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  HK: "Hong Kong",
  RU: "Russia",
  UA: "Ukraine",
  IL: "Israel",
  NZ: "New Zealand",
};

export function countryName(code: string | undefined): string {
  if (!code) return "Unknown";
  const upper = code.toUpperCase();
  if (upper === "T1" || upper === "XX") return "Unknown";
  return COUNTRY_NAMES[upper] || upper;
}

export async function recordTrafficHit(hit: TrafficHit) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await appendFile(FILE, `${JSON.stringify(hit)}\n`, "utf8");
  try {
    const info = await stat(FILE);
    if (info.size > MAX_BYTES) {
      const text = await readFile(FILE, "utf8");
      const lines = text.trim().split("\n");
      await writeFile(FILE, `${lines.slice(-12000).join("\n")}\n`, "utf8");
    }
  } catch {
    /* ignore prune errors */
  }
}

export async function readTrafficHits(fromMs: number): Promise<TrafficHit[]> {
  let text = "";
  try {
    text = await readFile(FILE, "utf8");
  } catch {
    return [];
  }
  const rows: TrafficHit[] = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    try {
      const row = JSON.parse(line) as TrafficHit;
      if (row.t >= fromMs) rows.push(row);
    } catch {
      /* skip */
    }
  }
  return rows;
}

export function summarizeTraffic(hits: TrafficHit[]) {
  const sources = new Map<string, number>();
  const paths = new Map<string, number>();
  const countries = new Map<string, number>();
  const unique = new Set<string>();
  const byDay = new Map<string, number>();
  for (const hit of hits) {
    sources.set(hit.source, (sources.get(hit.source) ?? 0) + 1);
    paths.set(hit.path, (paths.get(hit.path) ?? 0) + 1);
    const code = hit.country && hit.country !== "T1" && hit.country !== "XX" ? hit.country.toUpperCase() : "";
    if (code) countries.set(code, (countries.get(code) ?? 0) + 1);
    unique.add(hit.sid);
    const day = new Date(hit.t).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const total = hits.length || 1;
  return {
    visits: hits.length,
    unique: unique.size,
    sources: [...sources.entries()]
      .map(([source, count]) => ({ source, count, pct: Math.round((count / total) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count),
    countries: [...countries.entries()]
      .map(([code, count]) => ({
        code,
        name: countryName(code),
        count,
        pct: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    paths: [...paths.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    series: [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, visits]) => ({ date, visits })),
  };
}

export function rangeToMs(range: string) {
  const now = Date.now();
  if (range === "24h") return now - 24 * 60 * 60 * 1000;
  const days = range === "7" ? 7 : range === "15" ? 15 : range === "90" ? 90 : range === "365" || range === "1y" ? 365 : 30;
  return now - days * 86400000;
}
