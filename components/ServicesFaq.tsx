import { pageExtras } from "@/lib/orbit/page-extras";

export function ServicesFaq() {
  const faq = pageExtras("/services").faq;
  const items = faq?.items ?? [];
  return (
    <section className="services-faq" id="services-faq" aria-labelledby="services-faq-title">
      <h2 id="services-faq-title" className="services-faq-title">
        {faq?.title || "Frequently asked"}{" "}
        {faq?.titleAccent ? <span className="grad">{faq.titleAccent}</span> : null}
      </h2>
      <p className="services-faq-lede">{faq?.lede}</p>
      <div className="services-faq-list">
        {items.map((item) => (
          <details key={item.q} className="services-faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}