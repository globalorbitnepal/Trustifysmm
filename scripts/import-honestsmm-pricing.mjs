#!/usr/bin/env node
/**
 * Fetches public services markup and rebuilds data/service-pricing.json
 * Usage: npm run data:import-pricing
 */
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "data/service-pricing.json");
const source = process.argv[2];

if (!source) {
  console.error("Usage: node scripts/import-honestsmm-pricing.mjs <path-to-fetched-services.txt>");
  process.exit(1);
}

const raw = fs.readFileSync(source, "utf8");
const lines = raw.split("\n");
let currentCategory = "General";
const services = [];
const rowRe = /^\| (\d+) \| (.+)$/;

for (const line of lines) {
  if (line.startsWith("| ---") || line.includes("| ID | Service |")) continue;
  const header = line.match(/^\| ([^|]+) \|/);
  if (header && !rowRe.test(line) && !header[1].includes("Rate per 1000")) {
    currentCategory = header[1].trim();
    continue;
  }
  const m = rowRe.exec(line);
  if (!m) continue;
  const id = Number(m[1]);
  const rest = m[2];
  const priceMatch = rest.match(/\$([0-9]+(?:\.[0-9]+)?)/);
  if (!priceMatch) continue;
  const price = parseFloat(priceMatch[1]);
  const beforePrice = rest.slice(0, priceMatch.index).replace(/\|/g, " ").replace(/\s+/g, " ").trim();
  const afterPrice = rest.slice(priceMatch.index + priceMatch[0].length).replace(/^\s*\|/, "").trim();
  const parts = afterPrice.split("|").map((s) => s.trim());
  const lower = beforePrice.toLowerCase();
  const platform =
    [
      ["instagram", "instagram"],
      ["facebook", "facebook"],
      ["youtube", "youtube"],
      ["tiktok", "tiktok"],
      ["telegram", "telegram"],
      ["threads", "threads"],
      ["snapchat", "snapchat"],
      ["whatsapp", "whatsapp"],
      ["linkedin", "linkedin"],
      ["spotify", "spotify"],
      ["pinterest", "pinterest"],
      ["twitter", "x"],
    ].find(([k]) => lower.includes(k))?.[1] ?? "other";

  services.push({
    id,
    name: beforePrice,
    category: currentCategory,
    platform,
    ratePer1000: price,
    minOrder: parts[0] || "",
    maxOrder: parts[1] || "",
    avgTime: parts[2] || "",
    description: parts.slice(3).join(" ").replace(/View Details/i, "").trim().slice(0, 280),
  });
}

const platformLabel = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  telegram: "Telegram",
  x: "X (Twitter)",
  threads: "Threads",
  whatsapp: "WhatsApp",
  snapchat: "Snapchat",
  linkedin: "LinkedIn",
  spotify: "Spotify",
  pinterest: "Pinterest",
  other: "Other Services",
};

const typeWords = [
  ["followers", "Followers"],
  ["subscriber", "Subscribers"],
  ["likes", "Likes"],
  ["views", "Views"],
  ["comments", "Comments"],
  ["shares", "Shares"],
  ["reactions", "Reactions"],
  ["members", "Members"],
  ["story", "Story"],
  ["reels", "Reels"],
  ["reel", "Reels"],
  ["impressions", "Impressions"],
  ["retweets", "Retweets"],
  ["reposts", "Reposts"],
  ["live", "Live"],
];

for (const s of services) {
  const lower = s.name.toLowerCase();
  const label = typeWords.find(([k]) => lower.includes(k))?.[1];
  const base = platformLabel[s.platform] || "Other";
  s.group = label ? `${base} ${label}` : `${base} Services`;
}

const payload = {
  services,
  groups: [...new Set(services.map((s) => s.group))].sort(),
  platforms: Object.keys(platformLabel),
  platformLabel,
  serviceCount: services.length,
  updatedAt: new Date().toISOString().slice(0, 10),
};

fs.writeFileSync(out, JSON.stringify(payload));
console.log(`Wrote ${services.length} services to ${out}`);