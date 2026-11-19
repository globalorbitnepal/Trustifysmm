import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ALL_LANDING_PAGES } from "@/lib/seo/pages";
import { buildMetadata } from "@/lib/seo/metadata";
import { PRIVATE_ROUTE_PREFIXES, isPrivatePath } from "@/lib/seo/site";
import pricingData from "@/data/service-pricing.json";
import type { ServicePricingData } from "@/data/service-pricing-types";
import { priceRowsFor } from "@/lib/seo/landing-types";

const catalog = pricingData as unknown as ServicePricingData;

describe("SEO landing page inventory", () => {
  it("publishes at least 30 landing pages", () => {
    expect(ALL_LANDING_PAGES.length).toBeGreaterThanOrEqual(30);
  });

  it("uses a unique slug for every page", () => {
    const slugs = ALL_LANDING_PAGES.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses a unique meta title and description for every page", () => {
    const titles = ALL_LANDING_PAGES.map((page) => page.metaTitle);
    const descriptions = ALL_LANDING_PAGES.map((page) => page.metaDescription);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("keeps titles and descriptions inside sane SERP lengths", () => {
    for (const page of ALL_LANDING_PAGES) {
      expect(page.metaTitle.length, `${page.slug} title too long`).toBeLessThanOrEqual(80);
      expect(page.metaDescription.length, `${page.slug} description too short`).toBeGreaterThanOrEqual(110);
      expect(page.metaDescription.length, `${page.slug} description too long`).toBeLessThanOrEqual(200);
    }
  });

  it("gives every page real body content rather than a thin template", () => {
    for (const page of ALL_LANDING_PAGES) {
      expect(page.sections.length, `${page.slug} sections`).toBeGreaterThanOrEqual(4);
      expect(page.faq.length, `${page.slug} faq`).toBeGreaterThanOrEqual(3);
      expect(page.intro.length, `${page.slug} intro`).toBeGreaterThanOrEqual(2);
      expect(page.related.length, `${page.slug} related`).toBeGreaterThanOrEqual(3);
      const words = [
        ...page.intro,
        ...page.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
      ]
        .join(" ")
        .split(/\s+/).length;
      expect(words, `${page.slug} word count`).toBeGreaterThanOrEqual(350);
    }
  });

  it("never advertises a service group the live catalog cannot price", () => {
    for (const page of ALL_LANDING_PAGES) {
      const rows = priceRowsFor(catalog, page.priceGroups);
      expect(rows.length, `${page.slug} has no priced services`).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.lowest).toBeGreaterThan(0);
        expect(row.highest).toBeGreaterThanOrEqual(row.lowest);
        expect(row.count).toBeGreaterThan(0);
      }
    }
  });

  it("points every related link at a real published page", () => {
    const slugs = new Set(ALL_LANDING_PAGES.map((page) => page.slug));
    for (const page of ALL_LANDING_PAGES) {
      for (const related of page.related) {
        expect(slugs.has(related), `${page.slug} -> ${related}`).toBe(true);
      }
    }
  });

  it("uses an image asset that exists on disk", () => {
    for (const page of ALL_LANDING_PAGES) {
      const file = path.join(process.cwd(), "public", page.image.src.replace(/^\//, ""));
      expect(() => readFileSync(file), `${page.slug} image ${page.image.src}`).not.toThrow();
      expect(page.image.alt.length, `${page.slug} alt text`).toBeGreaterThan(20);
    }
  });

  it("avoids unverifiable claims on landing pages", () => {
    const banned = [
      /we guarantee/i,
      /guaranteed (?:#1|first page|rankings?|monetis\w+|monetiz\w+|growth|results)/i,
      /official partner/i,
      /100% safe/i,
      /instant viral/i,
    ];
    for (const page of ALL_LANDING_PAGES) {
      // Negated disclaimers ("no service can guarantee…") are allowed; affirmative claims are not.
      const text = [
        page.metaTitle,
        page.metaDescription,
        page.intro.join(" "),
        page.sections.flatMap((section) => section.paragraphs).join(" "),
        page.faq.map((item) => `${item.q} ${item.a}`).join(" "),
      ]
        .join(" ")
        .replace(/\b(?:cannot|can not|never|no service can|no panel can|no provider can|not)\s+\w*\s*guarantee\w*/gi, " ")
        .replace(/\bguarantee\w*\s+(?:is|are|was|were)\s+not\b/gi, " ");
      for (const pattern of banned) {
        expect(pattern.test(text), `${page.slug} matched ${pattern}`).toBe(false);
      }
    }
  });
});

describe("SEO metadata builder", () => {
  it("emits a canonical, OG card and Twitter card for every public page", () => {
    for (const page of ALL_LANDING_PAGES) {
      const meta = buildMetadata({
        path: `/${page.slug}`,
        title: page.metaTitle,
        description: page.metaDescription,
      });
      expect(meta.alternates?.canonical).toBe(`https://trustifysmm.com/${page.slug}`);
      expect(meta.openGraph?.title).toBe(page.metaTitle);
      expect(meta.twitter).toBeTruthy();
      expect((meta.robots as { index?: boolean }).index).toBe(true);
    }
  });

  it("marks noindex pages as non-indexable and follow free", () => {
    const meta = buildMetadata({ path: "/signin", title: "Sign In", description: "x".repeat(60), noindex: true });
    expect((meta.robots as { index?: boolean }).index).toBe(false);
    expect((meta.robots as { follow?: boolean }).follow).toBe(false);
  });
});

describe("private route protection", () => {
  it("classifies every private prefix as private", () => {
    for (const prefix of PRIVATE_ROUTE_PREFIXES) {
      expect(isPrivatePath(prefix)).toBe(true);
      expect(isPrivatePath(`${prefix}/anything`)).toBe(true);
    }
  });

  it("does not classify public routes as private", () => {
    for (const publicPath of ["/", "/services", "/smm-panel", "/buy-instagram-followers", "/social-media-services"]) {
      expect(isPrivatePath(publicPath), publicPath).toBe(false);
    }
  });

  it("keeps every landing page out of the private set", () => {
    for (const page of ALL_LANDING_PAGES) {
      expect(isPrivatePath(`/${page.slug}`), page.slug).toBe(false);
    }
  });
});
