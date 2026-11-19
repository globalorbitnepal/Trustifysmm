import Link from "next/link";

export function Logo({ src = "/brand/logo-header-clear.png" }: { src?: string }) {
  return (
    <Link href="/" className="logo" aria-label="TrustifySMM home">
      <img className="logo-img" src={src} alt="TrustifySMM SMM Panel" width={280} height={93} decoding="async" fetchPriority="high" />
    </Link>
  );
}
