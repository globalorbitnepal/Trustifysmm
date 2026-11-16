import type { CryptoId } from "@/components/CryptoBrandIcon";

const src: Record<CryptoId | "wallet", string> = {
  wallet: "/brand/crypto/wallet-scene.png",
  btc: "/brand/crypto/glass-btc.png",
  eth: "/brand/crypto/glass-eth.png",
  usdt: "/brand/crypto/glass-usdt.png",
  sol: "/brand/crypto/glass-sol.png",
};

export function PayCoinArt({ id, className }: { id: CryptoId | "wallet"; className?: string }) {
  return (
    <img
      className={className ?? "pay-coin-art"}
      src={src[id]}
      alt=""
      width={1024}
      height={1024}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}