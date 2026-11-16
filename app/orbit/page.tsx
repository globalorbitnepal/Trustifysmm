import type { Metadata } from "next";
import { OrbitDashboard } from "@/components/orbit/OrbitDashboard";

export const metadata: Metadata = {
  title: "Orbit Dashboard | TrustifySMM",
  robots: { index: false, follow: false },
};

export default function OrbitPage() {
  return <OrbitDashboard />;
}