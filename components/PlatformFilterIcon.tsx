import type { ReactNode } from "react";
import { BrandGlassIcon, type BrandGlassId } from "@/components/BrandGlassIcon";

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
};

export function PlatformFilterIcon({ platform, className = "services-pricing-platform-icon" }: PlatformFilterIconProps) {
  if (platform === "all") {
    return (
      <span className={`services-pricing-platform-icon-wrap ${className}`} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" className="services-pricing-platform-svg">
          <path d="M4 6h7v7H4V6ZM13 4h7v9h-7V4ZM13 15h7v5h-7v-5ZM4 17h7v3H4v-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (GLASS_PLATFORMS.has(platform)) {
    return (
      <BrandGlassIcon
        id={platform as BrandGlassId}
        className={className}
      />
    );
  }

  return (
    <span className={`services-pricing-platform-icon-wrap ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="services-pricing-platform-svg">
        {extraGlyphs[platform] ?? extraGlyphs.other}
      </svg>
    </span>
  );
}

const extraGlyphs: Record<string, ReactNode> = {
  linkedin: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2" />
      <path
        d="M7.2 10.2V18H5V10.2h2.2ZM6.1 8.4c.7 0 1.2-.5 1.2-1.2S6.8 5.9 6.1 5.9 5 6.5 5 7.2s.5 1.2 1.1 1.2ZM19 18h-2.2v-3.8c0-.9-.02-2.1-1.28-2.1-1.28 0-1.48 1-1.48 2v3.9H12V10.2h2.1v.9h.03c.3-.55 1.02-1.13 2.1-1.13 2.25 0 2.66 1.48 2.66 3.4V18Z"
        fill="#fff"
      />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="10" fill="#1DB954" />
      <path
        d="M7.2 15.2c3.5-.8 7.3-.7 10.6 0M6.6 12.4c4-.9 8.4-.75 12.2.05M6 9.6c4.6-1 9.6-.85 13.8.1"
        stroke="#fff"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </>
  ),
  pinterest: (
    <>
      <circle cx="12" cy="12" r="10" fill="#E60023" />
      <path
        d="M12 6.5c-2.6 0-4.5 1.8-4.5 4.2 0 1.8.95 2.7 1.7 2.7.3 0 .45-.22.45-.5 0-.35-.2-1-.3-1.55-.1-.45-.07-.75.25-1.15.7-.85 1.15-1.6 1.15-2.9 0-1.5-1.1-2.55-2.85-2.55-2.15 0-3.25 1.55-3.25 3.2 0 .95.35 1.6.9 1.9.1.06.12.03.12-.08l-.12-.75c-.02-.18-.02-.35.12-.55.35-.45.65-1.25.65-1.95 0-1.45-.85-2.55-2.35-2.55-1.55 0-2.6 1.2-2.6 2.95 0 .95.35 1.45.8 1.7l-.35 1.45s-.02.1.02.12c.12.04.4.12.55.18.4.15.85.28 1.25.4.65.2 1.25.35 1.85.35 2.65 0 4.4-1.75 4.4-4.05 0-2.4-1.95-4.05-4.35-4.05Z"
        fill="#fff"
      />
    </>
  ),
  other: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};