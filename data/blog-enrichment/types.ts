import type { BlogBlock, BlogFaqItem } from "@/data/blog-types";

export type BlogEnrichment = { extraBlocks: BlogBlock[]; faq: BlogFaqItem[] };
export type { BlogBlock, BlogFaqItem };