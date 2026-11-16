import type { Metadata } from "next";
import { Suspense } from "react";
import { OrbitLogin } from "@/components/orbit/OrbitLogin";

export const metadata: Metadata = {
  title: "Orbit Control Center | TrustifySMM",
  robots: { index: false, follow: false },
};

export default function OrbitLoginPage() {
  return (
    <Suspense fallback={<main className="orbit-cc" />}>
      <OrbitLogin />
    </Suspense>
  );
}