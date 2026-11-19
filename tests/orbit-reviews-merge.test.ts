import { describe, expect, it } from "vitest";
import { mergeSiteConfig } from "@/lib/orbit/site-config-sync";
import { defaultCustomerReviews } from "@/lib/orbit/home-defaults";

/**
 * The homepage review carousel is edited from /orbit, so the merge rule decides whether an
 * admin's change is actually published. These tests pin the three states that matter.
 */
describe("customer review config merge", () => {
  it("falls back to the built-in reviews when the field was never edited", () => {
    const merged = mergeSiteConfig({} as never);
    expect(merged.customerReviews).toHaveLength(defaultCustomerReviews.length);
  });

  it("keeps a custom review list, including a replaced avatar path", () => {
    const custom = [
      {
        name: "Test Person",
        country: "Nepal",
        flag: "🇳🇵",
        avatar: "/media/orbit/replaced.webp",
        text: "Testing the replace flow.",
        tone: "violet" as const,
      },
    ];
    const merged = mergeSiteConfig({ customerReviews: custom } as never);
    expect(merged.customerReviews).toHaveLength(1);
    expect(merged.customerReviews[0].avatar).toBe("/media/orbit/replaced.webp");
  });

  it("respects an explicitly emptied list instead of restoring the defaults", () => {
    const merged = mergeSiteConfig({ customerReviews: [] } as never);
    expect(merged.customerReviews).toHaveLength(0);
  });
});
