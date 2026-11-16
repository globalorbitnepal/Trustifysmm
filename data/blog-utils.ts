import { blogCoverBySlug } from "@/data/blog-covers";
import { blogEnrichment } from "@/data/blog-enrichment";
import type { BlogBlock, BlogFaqItem, BlogPost, BlogPostDraft, BlogTocItem } from "@/data/blog-types";
import { blogPosts as blogPostsDraft } from "@/data/blog-posts";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function wordsInBlocks(blocks: BlogBlock[]) {
  let n = 0;
  for (const b of blocks) {
    if (b.type === "p" || b.type === "quote") n += countWords(b.text);
    if (b.type === "h2" || b.type === "h3") n += countWords(b.text);
    if (b.type === "ul") for (const item of b.items) n += countWords(item);
  }
  return n;
}

function wordsInFaq(faq: BlogFaqItem[]) {
  return faq.reduce((sum, item) => sum + countWords(item.q) + countWords(item.a), 0);
}

function estimateReadMinutes(blocks: BlogBlock[], faq: BlogFaqItem[]) {
  const words = wordsInBlocks(blocks) + wordsInFaq(faq);
  return Math.max(14, Math.round(words / 220));
}

export function enrichBlogPost(draft: BlogPostDraft): BlogPost {
  const extra = blogEnrichment[draft.slug];
  const blocks = [...draft.blocks, ...(extra?.extraBlocks ?? [])];
  const faq = extra?.faq ?? [];
  const image = blogCoverBySlug[draft.slug] ?? draft.image;
  const readMinutes = estimateReadMinutes(blocks, faq);
  return { ...draft, blocks, faq, image, readMinutes };
}

const blogPosts: BlogPost[] = blogPostsDraft.map(enrichBlogPost);

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getBlogSlugs(): string[] {
  return blogPostsDraft.map((p) => p.slug);
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  const draft = blogPostsDraft.find((p) => p.slug === slug);
  return draft ? enrichBlogPost(draft) : undefined;
}

export function getBlogToc(blocks: BlogBlock[], includeFaq = true): BlogTocItem[] {
  const fromBlocks: BlogTocItem[] = blocks
    .filter((b): b is Extract<BlogBlock, { type: "h2" } | { type: "h3" }> => b.type === "h2" || b.type === "h3")
    .map((b) => ({
      id: b.id,
      text: b.text,
      level: (b.type === "h2" ? 2 : 3) as 2 | 3,
    }));

  if (includeFaq) {
    const faqToc: BlogTocItem = { id: "faq", text: "FAQ", level: 2 };
    return [...fromBlocks, faqToc];
  }
  return fromBlocks;
}

export function formatBlogDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}