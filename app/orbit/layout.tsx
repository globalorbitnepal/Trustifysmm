import type { Metadata } from "next";
import { OrbitShell } from "@/components/orbit/OrbitShell";
import "./orbit.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OrbitRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem("trustify-orbit-theme")==="dark")document.documentElement.dataset.orbit="dark"}catch(e){}`,
        }}
      />
      <OrbitShell>{children}</OrbitShell>
    </>
  );
}
