type PlatformId = "instagram" | "youtube" | "tiktok" | "facebook" | "telegram" | "x" | "whatsapp" | "snapchat" | "threads" | string;

const gradients: Record<string, [string, string]> = {
  instagram: ["#feda75", "#d62976"],
  youtube: ["#ff5f5f", "#d90429"],
  tiktok: ["#25f4ee", "#111827"],
  facebook: ["#4f9bff", "#1d4ed8"],
  telegram: ["#5ee0ff", "#0284c7"],
  x: ["#4b5563", "#111827"],
  whatsapp: ["#57e389", "#128c4a"],
  snapchat: ["#fde047", "#eab308"],
  threads: ["#64748b", "#0f172a"],
};

/** Crisp vector platform badge — no raster blur at any DPI. */
export function PlatformBadge({ id, size = 30 }: { id: PlatformId; size?: number }) {
  const key = id.toLowerCase();
  const [from, to] = gradients[key] ?? ["#a78bfa", "#6d3df0"];
  const gradId = `pb-${key}`;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-hidden style={{ flex: "none", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${gradId})`} />
      <rect x="0.6" y="0.6" width="38.8" height="38.8" rx="11.4" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.2" />
      <g transform="translate(8 8)" fill="#ffffff">
        {key === "instagram" ? (
          <>
            <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="6.4" fill="none" stroke="#ffffff" strokeWidth="2.1" />
            <circle cx="12" cy="12" r="5" fill="none" stroke="#ffffff" strokeWidth="2.1" />
            <circle cx="18" cy="6.4" r="1.5" fill="#ffffff" />
          </>
        ) : key === "youtube" ? (
          <>
            <rect x="1.4" y="4.6" width="21.2" height="14.8" rx="4.6" fill="#ffffff" />
            <path d="M10.2 8.6l6 3.4-6 3.4z" fill={to} />
          </>
        ) : key === "tiktok" ? (
          <path
            d="M14.6 2.4h3.2c.3 2.6 1.9 4.3 4.6 4.6v3.3c-1.8 0-3.4-.5-4.6-1.4v7.3a7 7 0 1 1-6.4-7v3.4a3.6 3.6 0 1 0 3.2 3.6z"
            fill="#ffffff"
          />
        ) : key === "facebook" ? (
          <path d="M14.4 22V12.9h-3V9.8h3V7.7c0-3 1.8-4.6 4.4-4.6 1.2 0 2.3.1 2.6.15v3h-1.8c-1.4 0-1.7.7-1.7 1.7v2h3.4l-.45 3.1h-2.95V22z" fill="#ffffff" />
        ) : key === "telegram" ? (
          <path d="M21.6 5.2 2.9 12.4c-1 .4-1 1.8.1 2.1l4.7 1.4 1.8 5.6c.3.9 1.4 1.1 2 .4l2.5-2.6 4.8 3.5c.8.6 1.9.2 2.1-.8l3.1-15c.2-1-.8-1.9-1.8-1.8h-.6ZM9.6 15.1l8.7-5.4-7 6.9-.4 3.2z" fill="#ffffff" />
        ) : key === "x" ? (
          <path d="M3.4 3.4h4.9l5 6.9 5.6-6.9h1.9l-6.7 8.2 7.3 9.9h-4.9l-5.3-7.3-6 7.3H3.3l7.1-8.7z" fill="#ffffff" />
        ) : key === "whatsapp" ? (
          <path d="M12 2.6A9.3 9.3 0 0 0 3.9 16.4L2.6 21.4l5.2-1.3A9.3 9.3 0 1 0 12 2.6Zm5.2 13c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.1-.9s-3.5-3.5-3.6-3.7c-.1-.2-.9-1.4-.9-2.6s.6-1.8.9-2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.3 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.2.1.4.1.6-.1l.8-.9c.2-.2.3-.2.5-.1l1.8.9c.3.1.5.2.5.3.1.3.1.9-.1 1.4Z" fill="#ffffff" />
        ) : key === "snapchat" ? (
          <path d="M12 3c2.6 0 4.4 1.9 4.4 4.5 0 .8-.1 1.5-.1 2 .2.2.6.2 1 .1.6-.1 1.2.2 1.3.7.1.6-.4 1-1.1 1.2-.5.2-1 .3-1 .9 0 .9 1.5 2.9 3.6 3.4.5.1.6.5.4.9-.4.9-1.9 1.3-2.8 1.4-.3.5-.3 1-.7 1-.6 0-1.2-.3-2.1-.3-1.1 0-1.6.9-3 .9s-1.9-.9-3-.9c-.9 0-1.5.3-2.1.3-.4 0-.4-.5-.7-1-.9-.1-2.4-.5-2.8-1.4-.2-.4-.1-.8.4-.9 2.1-.5 3.6-2.5 3.6-3.4 0-.6-.5-.7-1-.9-.7-.2-1.2-.6-1.1-1.2.1-.5.7-.8 1.3-.7.4.1.8.1 1-.1 0-.5-.1-1.2-.1-2C7.6 4.9 9.4 3 12 3Z" fill="#ffffff" />
        ) : key === "threads" ? (
          <path d="M17 10.6c-.2-3.5-2.2-5.4-5-5.4-2 0-3.6.9-4.5 2.3l1.9 1.2c.6-.9 1.5-1.4 2.6-1.4 1.5 0 2.4.8 2.6 2.2a6 6 0 0 0-2.6-.5c-2.6.1-4.3 1.6-4.3 3.7 0 2 1.6 3.4 3.8 3.4 1.9 0 3.3-1 3.9-2.6.5.7.8 1.6.8 2.6 0 2.6-2 4.2-5 4.2-3.3 0-5.4-2.2-5.4-5.9 0-3.8 2.1-6 5.5-6 2.6 0 4.5 1.2 5.4 3.3l2.1-.8C20.2 5.6 18 4 14.9 4 10.5 4 7.6 7 7.6 12s2.9 8 7.3 8c4.1 0 6.9-2.3 6.9-6 0-1.4-.4-2.5-1-3.4h-3.8Zm-4.9 5.3c-1.1 0-1.8-.5-1.8-1.4 0-.9.8-1.5 2.1-1.5.9 0 1.7.2 2.4.5-.2 1.5-1.3 2.4-2.7 2.4Z" fill="#ffffff" />
        ) : (
          <circle cx="12" cy="12" r="4.4" fill="#ffffff" />
        )}
      </g>
    </svg>
  );
}