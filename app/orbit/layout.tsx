import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OrbitRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="orbit-root">{children}</div>;
}