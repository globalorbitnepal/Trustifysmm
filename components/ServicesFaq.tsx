import { servicesFaq } from "@/data/services-faq";

export function ServicesFaq() {
  return (
    <section className="services-faq" id="services-faq" aria-labelledby="services-faq-title">
      <h2 id="services-faq-title" className="services-faq-title">
        Frequently asked <span className="grad">questions</span>
      </h2>
      <p className="services-faq-lede">
        Everything you need to know about browsing services, prices and placing orders on TrustifySMM.
      </p>
      <div className="services-faq-list">
        {servicesFaq.map((item) => (
          <details key={item.q} className="services-faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}