import Link from "next/link";

type OrbitBrandLogoProps = {
  variant?: "login" | "sidebar";
  href?: string;
};

export function OrbitBrandLogo({ variant = "login", href = "/" }: OrbitBrandLogoProps) {
  const isLogin = variant === "login";

  const img = (
    <img
      className={`orbit-brand-logo-img${isLogin ? " orbit-brand-logo-img--login" : " orbit-brand-logo-img--sidebar"}`}
      src="/brand/logo-premium.png"
      srcSet="/brand/logo-uhd.png 2x"
      alt="TrustifySMM SMM Panel"
      width={1024}
      height={341}
      decoding="sync"
      loading="eager"
      fetchPriority="high"
    />
  );

  if (variant === "sidebar") {
    return (
      <div className="orbit-brand-logo orbit-brand-logo--sidebar">
        <span className="orbit-brand-logo-plate">{img}</span>
      </div>
    );
  }

  return (
    <Link href={href} className="orbit-cc-logo orbit-cc-logo-lockup" aria-label="TrustifySMM home">
      <span className="orbit-cc-logo-plate">{img}</span>
    </Link>
  );
}