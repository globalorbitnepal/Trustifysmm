import Link from "next/link";
import { formatRate, type PriceRow, type SeoLanding } from "@/lib/seo/landing-types";
import { ALL_LANDING_PAGES, landingBySlug } from "@/lib/seo/pages";

function relatedPages(slugs: string[]) {
  return slugs
    .map((slug) => landingBySlug(slug))
    .filter((page): page is SeoLanding => Boolean(page))
    .slice(0, 5);
}

export function SeoLandingPage({ page, priceRows }: { page: SeoLanding; priceRows: PriceRow[] }) {
  const related = relatedPages(page.related);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: page.family === "panel" ? "SMM Panel" : "Services", href: page.family === "panel" ? "/smm-panel" : "/services" },
    { label: page.breadcrumbLabel, href: `/${page.slug}` },
  ];

  return (
    <>
      <nav className="seo-crumbs" aria-label="Breadcrumb">
        <ol>
          {crumbs.map((crumb, index) => (
            <li key={crumb.href}>
              {index === crumbs.length - 1 ? (
                <span aria-current="page">{crumb.label}</span>
              ) : (
                <Link href={crumb.href}>{crumb.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <article className="seo-landing">
        <header className="seo-landing-head">
          <div className="seo-landing-head-copy">
            <p className="services-page-badge">
              <span className="seo-badge-dot" aria-hidden />
              {page.family === "panel" ? "SMM panel guide" : `${page.breadcrumbLabel} services`}
            </p>
            <h1 className="services-page-title seo-landing-h1">
              {page.h1} {page.h1Accent ? <span className="grad">{page.h1Accent}</span> : null}
            </h1>
            {page.intro.map((paragraph) => (
              <p className="services-page-lede" key={paragraph.slice(0, 40)}>
                {paragraph}
              </p>
            ))}
            <div className="services-page-hero-actions">
              <Link className="btn btn-primary btn-lg" href="/signup">
                Create free account
              </Link>
              <Link className="btn btn-ghost btn-lg" href="/services">
                Browse live catalog
              </Link>
            </div>
          </div>
          <figure className="seo-landing-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.image.src} alt={page.image.alt} width={220} height={220} loading="eager" decoding="async" />
          </figure>
        </header>

        {priceRows.length ? (
          <section className="seo-price-block" aria-labelledby="seo-price-title">
            <h2 id="seo-price-title">Current rates in the catalog</h2>
            <p className="seo-price-note">
              Every figure is taken from the live service catalog and priced per 1,000 units. Rates move when providers
              update their lists, so confirm on the service card before ordering.
            </p>
            <div className="seo-price-table" role="table" aria-label="Service rate ranges">
              <div className="seo-price-row seo-price-head" role="row">
                <span role="columnheader">Service</span>
                <span role="columnheader">Services</span>
                <span role="columnheader">From</span>
                <span role="columnheader">Up to</span>
              </div>
              {priceRows.map((row) => (
                <div className="seo-price-row" role="row" key={row.label}>
                  <span role="cell" data-label="Service">{row.label}</span>
                  <span role="cell" data-label="Services">{row.count}</span>
                  <span role="cell" data-label="From">{formatRate(row.lowest)}</span>
                  <span role="cell" data-label="Up to">{formatRate(row.highest)}</span>
                </div>
              ))}
            </div>
            <Link className="seo-inline-link" href="/pricing">
              See the full rate deck with every platform
            </Link>
          </section>
        ) : null}

        <div className="seo-landing-body">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 44)}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <section className="seo-steps" aria-labelledby="seo-how-title">
          <h2 id="seo-how-title">How it works</h2>
          <ol className="seo-step-list">
            {page.howItWorks.map((step, index) => (
              <li key={step.title}>
                <span className="seo-step-num" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="seo-two-col">
          <section>
            <h2>Delivery notes</h2>
            <ul className="seo-bullet-list">
              {page.delivery.map((item) => (
                <li key={item.slice(0, 40)}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>How to order</h2>
            <ol className="seo-bullet-list">
              {page.ordering.map((item) => (
                <li key={item.slice(0, 40)}>{item}</li>
              ))}
            </ol>
          </section>
        </div>

        <section className="services-faq seo-landing-faq" aria-labelledby="seo-faq-title">
          <h2 id="seo-faq-title" className="services-faq-title">
            {page.breadcrumbLabel} FAQ
          </h2>
          <div className="services-faq-list">
            {page.faq.map((item) => (
              <details className="services-faq-item" key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length ? (
          <section className="seo-related" aria-labelledby="seo-related-title">
            <h2 id="seo-related-title">Related services</h2>
            <div className="seo-related-grid">
              {related.map((item) => (
                <Link key={item.slug} href={`/${item.slug}`} className="seo-related-card">
                  <strong>{item.breadcrumbLabel}</strong>
                  <span>{item.metaDescription.slice(0, 110)}…</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="seo-cta" aria-labelledby="seo-cta-title">
          <h2 id="seo-cta-title">{page.ctaTitle}</h2>
          <p>{page.ctaText}</p>
          <div className="services-page-hero-actions">
            <Link className="btn btn-primary btn-lg" href="/signup">
              Create free account
            </Link>
            <Link className="btn btn-ghost btn-lg" href="/support">
              Ask support
            </Link>
          </div>
        </section>

        <nav className="seo-all-links" aria-label="All service pages">
          <h2>All TrustifySMM service pages</h2>
          <ul>
            {ALL_LANDING_PAGES.filter((item) => item.slug !== page.slug).map((item) => (
              <li key={item.slug}>
                <Link href={`/${item.slug}`}>{item.breadcrumbLabel}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </article>
    </>
  );
}
