import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DashboardContent } from "@/components/DashboardContent";

export const metadata: Metadata = {
  title: "Customer Dashboard | TrustifySMM",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <main className="page">
      <Header />
      <section className="auth-signup dashboard-page">
        <div className="auth-signup-inner">
          <DashboardContent />
        </div>
      </section>
      <Footer />
    </main>
  );
}