import Link from "next/link";

export type SeoSection = { heading: string; paragraphs: string[] };
export type SeoFaq = { q: string; a: string };

export function SeoArticle({
  id,
  badge,
  title,
  titleAccent,
  lede,
  sections,
  faqTitle,
  faq,
  canonicalPath,
}: {
  id: string;
  badge: string;
  title: string;
  titleAccent?: string;
  lede: string;
  sections: SeoSection[];
  faqTitle: string;
  faq: SeoFaq[];
  canonicalPath: string;
}) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${title} ${titleAccent || ""}`.trim(),
    description: lede,
    url: `https://trustifysmm.com${canonicalPath}`,
    isPartOf: { "@type": "WebSite", name: "TrustifySMM" },
  };

  return (
    <article className="seo-article" id={id}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <div className="services-page-inner seo-article-inner">
        <p className="services-page-badge">{badge}</p>
        <h1 className="services-page-title" id={`${id}-title`}>
          {title} {titleAccent ? <span className="grad">{titleAccent}</span> : null}
        </h1>
        <p className="services-page-lede">{lede}</p>
        <div className="services-page-hero-actions">
          <Link className="btn btn-primary btn-lg" href="/signup">
            Create free account
          </Link>
          <Link className="btn btn-ghost btn-lg" href={`#${id}-faq`}>
            Read FAQ
          </Link>
        </div>
        <div className="seo-article-body">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
      <section className="services-faq" id={`${id}-faq`} aria-labelledby={`${id}-faq-title`}>
        <h2 id={`${id}-faq-title`} className="services-faq-title">
          {faqTitle}
        </h2>
        <div className="services-faq-list">
          {faq.map((item) => (
            <details key={item.q} className="services-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </article>
  );
}
