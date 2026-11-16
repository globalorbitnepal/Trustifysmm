import type { BrandGlassId } from "@/components/BrandGlassIcon";

export type ServiceTone = "violet" | "blue";

export type ServiceEntry = {
  id: BrandGlassId;
  title: string;
  tone: ServiceTone;
  popular?: boolean;
  items: readonly string[];
};

export const serviceCatalog: readonly ServiceEntry[] = [
  {
    id: "instagram",
    title: "Instagram Services",
    tone: "violet",
    popular: true,
    items: ["Followers", "Likes", "Views", "Comments", "Story Views", "Reels Views"],
  },
  {
    id: "youtube",
    title: "YouTube Services",
    tone: "blue",
    popular: true,
    items: ["Subscribers", "Views", "Likes", "Watch Time", "Comments", "Live Viewers"],
  },
  {
    id: "tiktok",
    title: "TikTok Services",
    tone: "violet",
    popular: true,
    items: ["Followers", "Likes", "Views", "Shares", "Comments", "Live Views"],
  },
  {
    id: "facebook",
    title: "Facebook Services",
    tone: "blue",
    popular: true,
    items: ["Page Followers", "Post Likes", "Video Views", "Shares", "Comments", "Group Members"],
  },
  {
    id: "x",
    title: "X (Twitter) Services",
    tone: "violet",
    popular: true,
    items: ["Followers", "Likes", "Retweets", "Impressions", "Comments", "Bookmarks"],
  },
  {
    id: "telegram",
    title: "Telegram Services",
    tone: "blue",
    items: ["Channel Members", "Post Views", "Reactions", "Bot Starts", "Group Members"],
  },
  {
    id: "whatsapp",
    title: "WhatsApp Services",
    tone: "violet",
    items: ["Channel Followers", "Status Views", "Group Members", "Broadcast Reach"],
  },
  {
    id: "snapchat",
    title: "Snapchat Services",
    tone: "blue",
    items: ["Story Views", "Spotlight Views", "Subscribers", "Snap Views"],
  },
  {
    id: "threads",
    title: "Threads Services",
    tone: "violet",
    items: ["Followers", "Likes", "Reposts", "Replies", "Profile Visits"],
  },
] as const;

export const popularServices = serviceCatalog.filter((s) => s.popular);
export const allServices = serviceCatalog;