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
  /** glass = UHD glass PNG · tile = flat brand SVG · bare = colored logo only · hd = legacy banner PNGs */
  variant?: "glass" | "hd" | "tile" | "glyph" | "bare";
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
        <svg viewBox="0 0 24 24" className="platform-brand-svg" aria-hidden>
          <path
            fill="currentColor"
            d="M3 4.5A1.5 1.5 0 0 1 4.5 3h6A1.5 1.5 0 0 1 12 4.5v6A1.5 1.5 0 0 1 10.5 12h-6A1.5 1.5 0 0 1 3 10.5v-6Zm9-1.5A1.5 1.5 0 0 1 13.5 3h6A1.5 1.5 0 0 1 21 4.5v6A1.5 1.5 0 0 1 19.5 12h-6A1.5 1.5 0 0 1 12 10.5v-6ZM3 13.5A1.5 1.5 0 0 1 4.5 12h6a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 10.5 21h-6A1.5 1.5 0 0 1 3 19.5v-6Zm9 0A1.5 1.5 0 0 1 13.5 12h6a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-6Z"
          />
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
    const bare = variant === "bare";
    const skin = TILE_SKIN[platform];
    const style: CSSProperties | undefined = bare || mono ? undefined : { backgroundColor: `#${icon.hex}` };
    const pathFill = bare
      ? (platform === "snapchat" ? "#000000" : `#${icon.hex}`)
      : mono
        ? "currentColor"
        : skin?.fill ?? "#ffffff";
    return (
      <span
        className={`platform-brand-wrap ${className}${mono ? " is-mono" : ""}${bare ? " is-bare" : ""}${skin?.className && !bare ? ` ${skin.className}` : ""}`}
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
      <svg viewBox="0 0 24 24" className="platform-brand-svg" aria-hidden>
        <path
          fill="currentColor"
          d="M11 5.25a.75.75 0 0 1 .75.75V11h4.25a.75.75 0 0 1 0 1.5H11.75v4.25a.75.75 0 0 1-1.5 0v-4.25H6a.75.75 0 0 1 0-1.5h4.25V6a.75.75 0 0 1 .75-.75Z"
        />
      </svg>
    </span>
  );
}