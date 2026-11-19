import Link from "next/link";
import Image from "next/image";
import { AuthSocialBackdrop } from "@/components/auth/AuthSocialBackdrop";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page page-auth-app">
      <AuthSocialBackdrop />
      <Link href="/" className="auth-app-home" aria-label="TrustifySMM home">
        <span className="auth-app-home-mark">
          <Image src="/brand/trustify-lockup.png" alt="TrustifySMM" width={220} height={59} priority />
        </span>
      </Link>
      {children}
    </main>
  );
}