import { liveSiteConfig } from "@/lib/orbit/live-catalog";
import { defaultCustomerReviews } from "@/lib/orbit/home-defaults";
import { sectionHeading } from "@/lib/orbit/public-copy";

export function CustomerReviews() {
  const site = liveSiteConfig();
  const reviews = site.customerReviews?.length ? site.customerReviews : defaultCustomerReviews;
  const looped = [...reviews, ...reviews];
  const copy = sectionHeading("reviews");
  return (
    <section className="reviews" id="reviews">
      <div className="reviews-inner">
        <p className="reviews-badge">
          <StarIcon />
          {copy.badge}
        </p>
        <h2 className="reviews-title">
          {copy.title} {copy.titleAccent ? <span className="grad">{copy.titleAccent}</span> : null}
        </h2>
        <p className="reviews-lede">{copy.lede}</p>

        <div className="reviews-marquee" aria-label="Customer reviews auto scroll">
          <div className="reviews-track">
          {looped.map((item, index) => (
            <article key={`${item.name}-${index}`} className={`review-card review-card--${item.tone}`}>
              <div className="review-top">
                <img className="review-avatar" src={item.avatar} alt="" width={104} height={104} loading="lazy" decoding="async" />
                <div className="review-meta">
                  <strong>{item.name}</strong>
                  <span className="review-country">
                    <span aria-hidden>{item.flag}</span>
                    {item.country}
                  </span>
                </div>
              </div>
              <div className="review-stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarFill key={i} />
                ))}
              </div>
              <p className="review-quote">
                <span className="review-mark" aria-hidden>
                  “
                </span>
                {item.text}
                <span className="review-mark review-mark-end" aria-hidden>
                  ”
                </span>
              </p>
            </article>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12 4.2 1.8 4.2 4.5.4-3.4 2.9 1 4.3L12 13.8l-4 2.2 1-4.3-3.4-2.9 4.5-.4L12 4.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StarFill() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden>
      <path
        d="m10 2.2 1.5 3.6 3.9.4-3 2.5.9 3.8L10 10.6l-3.3 1.9.9-3.8-3-2.5 3.9-.4L10 2.2Z"
        fill="#FBBF24"
      />
    </svg>
  );
}