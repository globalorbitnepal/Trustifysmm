import Link from "next/link";
import type { ReactNode } from "react";

export type PublicPageHeroProps = {
  id?: string;
  title: string;
  titleAccent?: string;
  lede: string;
  extraLede?: string;
  heroImage?: string;
  heroImageAlt?: string;
  titleClassName?: string;
  primary?: { label: string; href: string; download?: boolean; trailing?: ReactNode };
  secondary?: { label: string; href: string };
  children?: ReactNode;
};

export function PublicPageHero({
  id = "public-page-hero-title",
  title,
  titleAccent,
  lede,
  extraLede,
  heroImage,
  heroImageAlt,
  titleClassName,
  primary,
  secondary,
  children,
}: PublicPageHeroProps) {
  const titleClass = titleClassName ? `${titleClassName} services-page-title` : "services-page-title";

  return (
    <div className="public-page-hero public-page-hero--compact" aria-labelledby={id}>
      <h1 id={id} className={titleClass}>
        {title} {titleAccent ? <span className="grad">{titleAccent}</span> : null}
      </h1>
      <p className="services-page-lede">{lede}</p>
      {extraLede ? <p className="services-page-lede services-page-lede--note">{extraLede}</p> : null}
      {heroImage ? (
        <img
          src={heroImage}
          alt={heroImageAlt || ""}
          className="public-page-hero-media"
        />
      ) : null}
      {children}
      {(primary || secondary) && (
        <div className="services-page-hero-actions">
          {primary ? (
            primary.download || primary.href.includes(".php") ? (
              <a
                className="btn btn-primary btn-lg"
                href={primary.href}
                download={primary.download ?? primary.href.includes(".php")}
              >
                {primary.label}
                {primary.trailing ?? <HeroArrow />}
              </a>
            ) : (
              <Link className="btn btn-primary btn-lg" href={primary.href}>
                {primary.label}
                {primary.trailing ?? <HeroArrow />}
              </Link>
            )
          ) : null}
          {secondary ? (
            secondary.href.startsWith("#") ? (
              <a className="btn btn-ghost btn-lg" href={secondary.href}>
                {secondary.label}
              </a>
            ) : (
              <Link className="btn btn-ghost btn-lg" href={secondary.href}>
                {secondary.label}
              </Link>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

export function HeroStatGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="services-page-hero-stats" aria-label={label}>
      {children}
    </div>
  );
}

export function HeroStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="services-page-hero-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function HeroArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}