import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="TrustifySMM home">
      <img
        className="logo-img"
        src="/brand/logo-premium.png"
        alt="TrustifySMM SMM Panel"
        width={1024}
        height={341}
      />
    </Link>
  );
}
