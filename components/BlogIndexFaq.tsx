import { pageExtras } from "@/lib/orbit/page-extras";

export function BlogIndexFaq() {
  const faq = pageExtras("/blogs").faq;
  const items = faq?.items ?? [];
  return (
    <section className="blog-index-faq" id="blogs-faq" aria-labelledby="blogs-faq-title">
      <h2 id="blogs-faq-title" className="blog-index-faq-title">
        {faq?.title || "Blog"} {faq?.titleAccent ? <span className="grad">{faq.titleAccent}</span> : null}
      </h2>
      <p className="blog-index-faq-lede">{faq?.lede}</p>
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