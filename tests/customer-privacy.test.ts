import { describe, expect, it } from "vitest";
import { upstreamAsPricing } from "@/lib/smm-upstream/catalog";
import { publicDescription, publicText } from "@/lib/smm-upstream/public-text";

const PROVIDER = /honest\s*smm|\bapi\b|\bservers?\b|\bproviders?\b|\bpanels?\b|wholesale|upstream/i;

describe("customer text never names the integration", () => {
  it("strips provider wording from a category", () => {
    expect(publicText("Facebook Live Stream [ Premium Server ]")).toBe("Facebook Live Stream [ Premium ]");
    expect(publicText("Telegram Reactions [ API ]")).toBe("Telegram Reactions");
    expect(publicText("Instagram Followers - HonestSMM")).toBe("Instagram Followers");
    expect(publicText("Kick Views - Cheap Server")).toBe("Kick Views - Cheap");
  });

  it("keeps real product names", () => {
    expect(publicText("Discord x2 Server Boost [NO BOT] – 1 Month")).toBe("Discord x2 Server Boost [NO BOT] – 1 Month");
  });

  it("drops trailing separators only", () => {
    expect(publicText("Instagram Likes | 𝗖𝗵𝗲𝗮𝗽𝗲𝘀𝘁 |")).toBe("Instagram Likes | 𝗖𝗵𝗲𝗮𝗽𝗲𝘀𝘁");
  });

  it("describes a service without a rate or integration detail", () => {
    const text = publicDescription("Default");
    expect(text).not.toMatch(PROVIDER);
    expect(text).not.toMatch(/\$/);
    expect(publicDescription("Package")).toMatch(/Package/);
  });

  it("builds a customer row with no provider wording", () => {
    const row = {
      localId: 10001,
      providerId: "p",
      upstreamId: 3315,
      name: "Instagram Followers | Own Server | Cheap Service API |",
      category: "Instagram Followers [ Server ]",
      platform: "instagram",
      type: "Default",
      costPer1000: 0.1498,
      ratePer1000: 0.1947,
      min: 10,
      max: 1000,
      refill: true,
      cancel: true,
    };
    const priced = upstreamAsPricing(row);
    const text = `${priced.name} ${priced.group} ${priced.description}`;
    expect(text).not.toMatch(PROVIDER);
    expect(priced.id).toBe(10001);
    expect(priced.ratePer1000).toBe(0.1947);
    expect(priced.refill).toBe(true);
  });
});
