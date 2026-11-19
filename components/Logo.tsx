import Link from "next/link";

/**
 * Header logo. When the default asset is in use it loads a responsive WebP set; a custom
 * logo configured in the CMS is passed through untouched so admin overrides still work.
 */
const DEFAULT_LOGO = "/brand/logo-header-clear.png";

export function Logo({ src = DEFAULT_LOGO }: { src?: string }) {
  const isDefault = src === DEFAULT_LOGO;
  return (
    <Link href="/" className="logo" aria-label="TrustifySMM home">
      <img
        className="logo-img"
        src={isDefault ? "/img/logo/logo-header-clear-420.webp" : src}
        {...(isDefault
          ? {
              srcSet: "/img/logo/logo-header-clear-200.webp 200w, /img/logo/logo-header-clear-320.webp 320w, /img/logo/logo-header-clear-420.webp 420w",
              sizes: "(max-width: 560px) 200px, (max-width: 860px) 260px, 391px",
            }
          : {})}
        alt="TrustifySMM SMM Panel"
        width={isDefault ? 420 : 280}
        height={isDefault ? 140 : 93}
        decoding="async"
        fetchPriority="high"
      />
    </Link>
  );
}
