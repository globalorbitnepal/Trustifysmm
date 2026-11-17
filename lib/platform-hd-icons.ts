/** UHD platform marks from official banner crops — crisp on light/dark panels. */
export const PLATFORM_HD_ICON: Record<string, string> = {
  instagram: "/brand/icon-instagram.png",
  youtube: "/brand/icon-youtube.png",
  tiktok: "/brand/icon-tiktok.png",
  facebook: "/brand/icon-facebook.png",
  x: "/brand/icon-x.png",
  twitter: "/brand/icon-x.png",
  telegram: "/brand/icon-telegram.png",
  whatsapp: "/brand/icon-whatsapp.png",
  snapchat: "/brand/icon-snapchat.png",
  threads: "/brand/icon-threads.png",
};

export function getPlatformHdSrc(platform: string): string | null {
  return PLATFORM_HD_ICON[platform] ?? null;
}