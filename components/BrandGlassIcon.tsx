const glassMap = {
  instagram: "glass-instagram",
  youtube: "glass-youtube",
  tiktok: "glass-tiktok",
  facebook: "glass-facebook",
  x: "glass-x",
  telegram: "glass-telegram",
  whatsapp: "glass-whatsapp",
  snapchat: "glass-snapchat",
  threads: "glass-threads",
} as const;

export type BrandGlassId = keyof typeof glassMap;

export function BrandGlassIcon({ id, className }: { id: BrandGlassId; className?: string }) {
  const file = glassMap[id];
  return (
    <img
      className={className ?? "brand-glass-icon"}
      src={`/brand/glass/${file}.png`}
      alt=""
      width={512}
      height={512}
      loading="lazy"
      decoding="async"
    />
  );
}