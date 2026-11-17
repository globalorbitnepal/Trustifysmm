import type { CSSProperties } from "react";
import { BrandGlassIcon, type BrandGlassId } from "@/components/BrandGlassIcon";
import { getPlatformBrandIcon } from "@/lib/platform-brand-icons";
import { getPlatformHdSrc } from "@/lib/platform-hd-icons";

const GLASS_PLATFORMS = new Set<string>([
  "instagram",
  "youtube",
  "tiktok",
  "facebook",
  "x",
  "telegram",
  "whatsapp",
  "snapchat",
  "threads",
]);

type PlatformFilterIconProps = {
  platform: string;
  className?: string;
  /** glass = UHD glass PNG · tile = flat brand SVG · hd = legacy banner PNGs */
  variant?: "glass" | "hd" | "tile" | "glyph";
};

const TILE_SKIN: Record<string, { fill: string; className?: string }> = {
  snapchat: { fill: "#000000", className: "platform-brand-wrap--snapchat" },
  instagram: { fill: "#ffffff", className: "platform-brand-wrap--instagram" },
};

export function PlatformFilterIcon({
  platform,
  className = "platform-brand-icon",
  variant = "tile",
}: PlatformFilterIconProps) {
  if (variant === "glass" && platform !== "all" && GLASS_PLATFORMS.has(platform)) {
    return (
      <span className={`platform-glass-chip ${className}`} aria-hidden>
        <BrandGlassIcon id={platform as BrandGlassId} className="platform-glass-img" />
      </span>
    );
  }

  if (platform === "all") {
    return (
      <span className={`platform-brand-wrap platform-brand-wrap--all ${className}`} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" className="platform-brand-svg">
          <path d="M4 6h7v7H4V6ZM13 4h7v9h-7V4ZM13 15h7v5h-7v-5ZM4 17h7v3H4v-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (variant === "hd") {
    const hd = getPlatformHdSrc(platform);
    if (hd) {
      return <img className={`platform-brand-hd ${className}`} src={hd} alt="" width={512} height={512} decoding="async" draggable={false} />;
    }
  }

  const icon = getPlatformBrandIcon(platform);
  if (icon) {
    const mono = variant === "glyph";
    const skin = TILE_SKIN[platform];
    const style: CSSProperties | undefined = mono ? undefined : { backgroundColor: `#${icon.hex}` };
    const pathFill = mono ? "currentColor" : skin?.fill ?? "#ffffff";
    return (
      <span
        className={`platform-brand-wrap ${className}${mono ? " is-mono" : ""}${skin?.className ? ` ${skin.className}` : ""}`}
        style={style}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" role="img" className="platform-brand-svg" aria-hidden>
          <path d={icon.path} fill={pathFill} />
        </svg>
      </span>
    );
  }

  return (
    <span className={`platform-brand-wrap platform-brand-wrap--other ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="platform-brand-svg">
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}