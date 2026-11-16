export type BlogBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string };

export type BlogFaqItem = { q: string; a: string };

export type BlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string[];
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  readMinutes: number;
  category: string;
  image: { src: string; alt: string };
  blocks: BlogBlock[];
  faq: BlogFaqItem[];
};

/** Source content before covers, FAQ merge and read-time calculation */
export type BlogPostDraft = Omit<BlogPost, "faq">;

export type BlogTocItem = { id: string; text: string; level: 2 | 3 };