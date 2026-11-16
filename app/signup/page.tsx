import Link from "next/link";
import { Header } from "@/components/Header";

export default function SignUpPage() {
  return (
    <main className="hero-shell">
      <Header />
      <section className="page-pad">
        <h1 className="headline">Create Free Account</h1>
        <p className="lede">Registration wiring comes after this landing hero is locked.</p>
        <p style={{ marginTop: 24 }}>
          <Link className="btn btn-primary" href="/">
            Back to home
          </Link>
        </p>
      </section>
    </main>
  );
}
