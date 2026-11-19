/**
 * One place for every absolute URL and brand constant the public SEO layer needs.
 * Nothing here reads request state, so it is safe in metadata, sitemaps and JSON-LD.
 */

export const SITE_URL = "https://trustifysmm.com";
export const SITE_NAME = "TrustifySMM";
export const SITE_LEGAL_NAME = "TrustifySMM";
export const SITE_SUPPORT_EMAIL = "support@trustifysmm.com";

export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/brand/og/trustifysmm-og.png`,
  width: 1200,
  height: 630,
  alt: "TrustifySMM — SMM panel for Instagram, TikTok, YouTube and Facebook services",
};

export const DEFAULT_TWITTER = "@trustifysmm";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Trailing-slash-free canonical path for a public route. */
export function canonicalPath(path: string): string {
  if (!path || path === "/") return "/";
  const clean = path.split("?")[0].split("#")[0];
  return clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

/** Routes that must never be indexed or appear in the sitemap. */
export const PRIVATE_ROUTE_PREFIXES = [
  "/orbit",
  "/admin",
  "/dashboard",
  "/api",
  "/account",
  "/checkout",
  "/payment",
  "/wallet",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export function isPrivatePath(path: string): boolean {
  const clean = canonicalPath(path);
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => clean === prefix || clean.startsWith(`${prefix}/`),
  );
}
