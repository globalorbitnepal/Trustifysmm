import Link from "next/link";
import { BrandGlassIcon } from "@/components/BrandGlassIcon";
import type { ServiceEntry } from "@/data/services";

export function ServiceCatalogGrid({ services }: { services: readonly ServiceEntry[] }) {
  return (
    <div className="popular-grid">
      {services.map((service) => (
        <article
          key={service.id}
          className={`service-card service-card--${service.id} service-card--${service.tone}`}
        >
          <h3 className="service-card-title">
            <span className="service-icon-wrap">
              <BrandGlassIcon id={service.id} className="service-glass-logo" />
            </span>
            <span>{service.title}</span>
          </h3>
          <ul className="service-list">
            {service.items.map((item) => (
              <li key={item}>
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
          <Link className={`service-order service-order--${service.tone}`} href="/signup">
            Order Now
            <Arrow />
          </Link>
        </article>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="rgba(168, 85, 247, 0.22)" />
      <path d="m8 12.2 2.4 2.4L16 9.2" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}