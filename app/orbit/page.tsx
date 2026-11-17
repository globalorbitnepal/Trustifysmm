import type { Metadata } from "next";
import { DashboardScreen } from "@/components/orbit/screens-business";

export const metadata: Metadata = { title: "Orbit Control Center | TrustifySMM", robots: { index: false, follow: false } };

export default function OrbitPage() {
  return <DashboardScreen />;
}
