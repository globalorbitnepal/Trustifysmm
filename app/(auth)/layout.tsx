import Link from "next/link";
import Image from "next/image";
import { AuthSocialBackdrop } from "@/components/auth/AuthSocialBackdrop";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="page page-auth-app">
      <AuthSocialBackdrop />
      <Link href="/" className="auth-app-home" aria-label="TrustifySMM home">
        <span className="auth-app-home-mark">
          <Image src="/brand/glass/glass-trustify-t.png" alt="" width={40} height={40} priority />
        </span>
      </Link>
      {children}
    </main>
  );
}