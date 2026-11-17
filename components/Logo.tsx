import Link from "next/link";

export function Logo({ src = "/brand/logo-header-clear.png" }: { src?: string }) {
  return (
    <Link href="/" className="logo" aria-label="TrustifySMM home">
      <img className="logo-img" src={src} alt="TrustifySMM SMM Panel" width={1024} height={341} decoding="async" />
    </Link>
  );
}
