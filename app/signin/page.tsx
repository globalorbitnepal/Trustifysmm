import Link from "next/link";
import { Header } from "@/components/Header";

export default function SignInPage() {
  return (
    <main className="hero-shell">
      <Header />
      <section className="page-pad">
        <h1 className="headline">Sign In</h1>
        <p className="lede">Account access will connect to the TrustifySMM panel next.</p>
        <p style={{ marginTop: 24 }}>
          <Link className="btn btn-primary" href="/">
            Back to home
          </Link>
        </p>
      </section>
    </main>
  );
}
