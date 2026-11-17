"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PanelUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "CUSTOMER";
  apiKey: string;
  balance: number;
};

export function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<PanelUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/signin?next=/dashboard");
          return;
        }
        const data = (await res.json()) as { user: PanelUser };
        setUser(data.user);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/signin");
    router.refresh();
  }

  if (loading) {
    return <p className="dashboard-loading">Loading your panel…</p>;
  }

  if (!user) return null;

  return (
    <div className="dashboard-grid">
      <header className="dashboard-hero">
        <div className="dashboard-user">
          {user.image ? (
            <img className="dashboard-avatar" src={user.image} alt="" width={56} height={56} />
          ) : (
            <span className="dashboard-avatar dashboard-avatar--fallback" aria-hidden>
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1>Welcome{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
            <p>{user.email}</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
          Log out
        </button>
      </header>

      <div className="dashboard-cards">
        <article className="dashboard-card">
          <p className="dashboard-card-label">Wallet balance</p>
          <p className="dashboard-card-value">${user.balance.toFixed(2)}</p>
          <Link className="btn btn-primary btn-sm" href="/api">
            Top up via Banker
          </Link>
        </article>
        <article className="dashboard-card">
          <p className="dashboard-card-label">API key</p>
          <code className="dashboard-api-key">{user.apiKey}</code>
          <Link className="btn btn-ghost btn-sm" href="/api">
            API documentation
          </Link>
        </article>
        <article className="dashboard-card">
          <p className="dashboard-card-label">Orders</p>
          <p className="dashboard-card-copy">Browse services and place new orders from the catalog.</p>
          <Link className="btn btn-primary btn-sm" href="/services">
            Open services
          </Link>
        </article>
      </div>
    </div>
  );
}