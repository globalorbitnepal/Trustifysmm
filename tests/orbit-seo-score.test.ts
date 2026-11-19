import { describe, expect, it } from "vitest";
import { seoChecks, seoGrade, seoScore } from "@/components/orbit/seo-score";

describe("Orbit SEO scoring", () => {
  it("scores an empty form as poor", () => {
    const checks = seoChecks({ title: "", description: "", focusKeyword: "", slug: "" });
    expect(seoScore(checks)).toBeLessThan(30);
    expect(seoGrade(seoScore(checks)).tone).toBe("bad");
  });

  it("passes length checks inside the recommended ranges", () => {
    const checks = seoChecks({
      title: "Buy Instagram Followers with Live Per-1K Rates",
      description:
        "Buy Instagram followers in tiers priced per 1,000 units, with minimum order size, start time and refill coverage shown before you order.",
      focusKeyword: "buy instagram followers",
      slug: "buy-instagram-followers",
      ogTitle: "Buy Instagram Followers | TrustifySMM",
      ogDescription: "Compare tiers and order from your wallet.",
      ogImage: "/brand/og/trustifysmm-og.png",
    });
    const byId = Object.fromEntries(checks.map((check) => [check.id, check.state]));
    expect(byId["title-length"]).toBe(2);
    expect(byId["desc-length"]).toBe(2);
    expect(byId["focus-keyword"]).toBe(2);
    expect(byId["keyword-in-title"]).toBe(2);
    expect(byId["keyword-in-slug"]).toBe(2);
    expect(byId["keyword-in-desc"]).toBe(2);
    expect(seoScore(checks)).toBe(100);
  });

  it("flags a title that is too long", () => {
    const checks = seoChecks({
      title: `${"Very long marketing headline ".repeat(4)}`.trim(),
      description: "x".repeat(140),
      focusKeyword: "smm panel",
      slug: "smm-panel",
    });
    expect(checks.find((c) => c.id === "title-length")?.state).toBe(0);
  });

  it("detects when the focus keyword is missing from the title", () => {
    const checks = seoChecks({
      title: "Buy TikTok Followers with Live Rates",
      description: "x".repeat(140),
      focusKeyword: "buy instagram followers",
      slug: "buy-tiktok-followers",
    });
    expect(checks.find((c) => c.id === "keyword-in-title")?.state).toBe(0);
    expect(checks.find((c) => c.id === "keyword-in-slug")?.state).toBe(1);
  });

  it("treats a short description as a warning, not a pass", () => {
    const checks = seoChecks({
      title: "Buy Instagram Followers with Live Per-1K Rates",
      description: "Short description.",
      focusKeyword: "buy instagram followers",
      slug: "buy-instagram-followers",
    });
    expect(checks.find((c) => c.id === "desc-length")?.state).toBe(1);
  });

  it("gives a good grade once the core checks pass, even before OG fields are filled", () => {
    const partial = seoChecks({
      title: "Buy Instagram Followers with Live Per-1K Rates",
      description:
        "Buy Instagram followers in tiers priced per 1,000 units, with minimum order size, start time and refill coverage shown before you order.",
      focusKeyword: "buy instagram followers",
      slug: "buy-instagram-followers",
    });
    // OG fields are warnings, so the core content checks alone clear 70.
    expect(seoScore(partial)).toBeGreaterThanOrEqual(70);
    expect(seoGrade(seoScore(partial)).tone).not.toBe("bad");
  });
});
