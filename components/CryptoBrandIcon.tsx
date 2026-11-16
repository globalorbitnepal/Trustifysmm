import type { CSSProperties } from "react";

export type CryptoId = "btc" | "eth" | "usdt" | "sol";

export function CryptoBrandIcon({
  id,
  className,
  style,
}: {
  id: CryptoId;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`crypto-chip crypto-chip--${id}${className ? ` ${className}` : ""}`} style={style}>
      <span className="crypto-chip-glow" aria-hidden />
      <Logo id={id} />
    </span>
  );
}

function Logo({ id }: { id: CryptoId }) {
  switch (id) {
    case "btc":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#F7931A" />
          <path
            d="M13.6 7.2c.1-1-.6-1.5-1.7-1.8l.3-1.5-1-.3-.3 1.4c-.3-.1-.6-.2-.9-.3l.3-1.4-1-.3-.3 1.5c-.2 0-.5-.1-.7-.1l-1.4-.4-.2 1.1s.8.2.8.2c.4.1.5.4.5.7l-.5 2.1c0 .1 0 .1-.1 0-.4-.1-.8-.2-.8-.2l-.4 1.2 1.3.4c.2.1.5.1.7.2l-.3 1.5 1 .3.3-1.5c.3.1.6.2.9.2l-.3 1.5 1 .3.3-1.4c2 .4 3.4.2 4-1.6.5-1.4 0-2.2-1-2.7.7-.2 1.3-.7 1.4-1.8Zm-2.5 3.9c-.4 1.5-2.8.7-3.6.5l.6-2.6c.8.2 3.4.6 3 2.1Zm.4-4c-.3 1.3-2.4.6-3.1.5l.6-2.3c.7.2 2.9.5 2.5 1.8Z"
            fill="#fff"
          />
        </svg>
      );
    case "eth":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#627EEA" />
          <path d="M12 5.5 8.5 12.2 12 16l3.5-3.8L12 5.5Z" fill="#fff" />
          <path d="M8.5 12.2 12 18.5l3.5-6.3L12 16l-3.5-3.8Z" fill="#dce4ff" />
        </svg>
      );
    case "usdt":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#26A17B" />
          <path
            d="M14.2 8.2H12V6.8H9.9v1.4H7.9v1.2c0 2.8 1.9 5.3 3.6 6.1v.1c-1.7.7-3.6 2.9-3.6 5.4v1.2H9.9v-1.3H12v1.3h1.9v-1.3h1.9v-1.2c0-2.8-1.9-5.3-3.6-6.1v-.1c1.7-.7 3.6-2.9 3.6-5.4V8.2h-1.9Z"
            fill="#fff"
          />
        </svg>
      );
    case "sol":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id="sol-mark" x1="4" y1="4" x2="20" y2="20">
              <stop stopColor="#00FFA3" />
              <stop offset="1" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#sol-mark)" />
          <path d="M8 14.5 11 11.5 16 11.5 13 14.5 16 17.5 11 17.5 8 14.5Z" fill="#fff" />
        </svg>
      );
    default:
      return null;
  }
}