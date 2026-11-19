const ART = {
  wallet: { base: "wallet-scene", widths: [256], size: 256 },
  btc: { base: "glass-btc", widths: [96, 192], size: 192 },
  eth: { base: "glass-eth", widths: [96, 192], size: 192 },
  usdt: { base: "glass-usdt", widths: [96, 192], size: 192 },
  sol: { base: "glass-sol", widths: [96, 192], size: 192 },
} as const;

export type CryptoArtId = keyof typeof ART;

export function PayCoinArt({ id, className, eager = false }: { id: CryptoArtId; className?: string; eager?: boolean }) {
  const entry = ART[id];
  const srcSet = entry.widths.map((width) => `/img/crypto/${entry.base}-${width}.webp ${width}w`).join(", ");
  return (
    <img
      className={className ?? "pay-coin-art"}
      src={`/img/crypto/${entry.base}-${entry.widths[entry.widths.length - 1]}.webp`}
      srcSet={srcSet}
      sizes="96px"
      alt=""
      width={entry.size}
      height={entry.size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}
