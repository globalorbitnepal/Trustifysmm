import { blogsIndexFaq } from "@/data/blogs-index-faq";

export function BlogIndexFaq() {
  return (
    <section className="blog-index-faq" id="blogs-faq" aria-labelledby="blogs-faq-title">
      <h2 id="blogs-faq-title" className="blog-index-faq-title">
        Blog <span className="grad">FAQ</span>
      </h2>
      <p className="blog-index-faq-lede">
        Common questions about our guides, images, SEO and how blogs connect to services and API documentation.
      </p>
      <div className="blog-post-faq-list">
        {blogsIndexFaq.map((item) => (
          <details key={item.q} className="blog-post-faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}