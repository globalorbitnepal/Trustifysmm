import type { BlogFaqItem } from "@/data/blog-types";

export function BlogPostFaq({ items }: { items: BlogFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="blog-post-faq" id="faq" aria-labelledby="blog-faq-title">
      <h2 id="blog-faq-title" className="blog-prose-h2">
        Frequently asked questions
      </h2>
      <p className="blog-post-faq-lede">
        SEO-friendly answers you can reuse in your storefront or support docs. Expand any item for the full breakdown.
      </p>
      <div className="blog-post-faq-list">
        {items.map((item) => (
          <details key={item.q} className="blog-post-faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}