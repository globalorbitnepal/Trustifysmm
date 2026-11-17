import type { CSSProperties } from "react";
import { getPlatformBrandIcon } from "@/lib/platform-brand-icons";

type PlatformFilterIconProps = {
  platform: string;
  className?: string;
  /** Full brand tile (colored) vs glyph-only for dense layouts */
  variant?: "tile" | "glyph";
};

export function PlatformFilterIcon({
  platform,
  className = "platform-brand-icon",
  variant = "tile",
}: PlatformFilterIconProps) {
  if (platform === "all") {
    return (
      <span className={`platform-brand-wrap ${className}`} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" className="platform-brand-svg">
          <path d="M4 6h7v7H4V6ZM13 4h7v9h-7V4ZM13 15h7v5h-7v-5ZM4 17h7v3H4v-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  const icon = getPlatformBrandIcon(platform);
  if (icon) {
    const mono = variant === "glyph";
    return (
      <span
        className={`platform-brand-wrap ${className}${mono ? " is-mono" : ""}`}
        style={mono ? undefined : ({ "--brand-hex": `#${icon.hex}` } as CSSProperties)}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" role="img" className="platform-brand-svg">
          <path d={icon.path} fill="currentColor" />
        </svg>
      </span>
    );
  }

  return (
    <span className={`platform-brand-wrap ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="platform-brand-svg">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="rgba(128,128,128,0.2)" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}