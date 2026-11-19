const glassMap = {
  instagram: { base: "glass-instagram", widths: [64, 128, 256], size: 256 },
  youtube: { base: "glass-youtube", widths: [64, 128, 256], size: 256 },
  tiktok: { base: "glass-tiktok", widths: [64, 128, 256], size: 256 },
  facebook: { base: "glass-facebook", widths: [64, 128, 256], size: 256 },
  x: { base: "glass-x", widths: [64, 128, 256], size: 256 },
  telegram: { base: "glass-telegram", widths: [64, 128, 256], size: 256 },
  whatsapp: { base: "glass-whatsapp", widths: [64, 128, 256], size: 256 },
  snapchat: { base: "glass-snapchat", widths: [64, 128, 256], size: 256 },
  threads: { base: "glass-threads", widths: [64, 128, 256], size: 256 },
} as const;

export type BrandGlassId = keyof typeof glassMap;

function srcSet(base: string, widths: readonly number[]) {
  return widths.map((width) => `/img/glass/${base}-${width}.webp ${width}w`).join(", ");
}

/**
 * Glass brand icon. The original 1024×1024 PNG stays in the repo for reference and for
 * the admin library, but the public site loads a WebP derivative sized to the box it is
 * painted in — typically a 96% smaller transfer for the same visual result.
 */
export function BrandGlassIcon({
  id,
  className,
  sizes = "96px",
  eager = false,
}: {
  id: BrandGlassId;
  className?: string;
  sizes?: string;
  /** Only the hero core should opt out of lazy loading. */
  eager?: boolean;
}) {
  const entry = glassMap[id];
  return (
    <img
      className={className ?? "brand-glass-icon"}
      src={`/img/glass/${entry.base}-256.webp`}
      srcSet={srcSet(entry.base, entry.widths)}
      sizes={sizes}
      alt=""
      width={entry.size}
      height={entry.size}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
    />
  );
}
