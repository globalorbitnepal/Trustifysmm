"use client";

import { usePathname } from "next/navigation";

export function PageEnter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/orbit")) return children;
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
