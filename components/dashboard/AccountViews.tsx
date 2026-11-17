"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Empty, Skeleton } from "@/components/dashboard/OverviewView";
import { apiDocEndpoints } from "@/data/api-documentation";

export function TicketsView() {
  const [tickets, setTickets] = useState<{ id: string; subject: string; category: string; priority: string; status: string; updatedAt: string }[] | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    void fetch(`/api/dashboard/tickets?${params}`).then(async (res) => {
      if (res.ok) setTickets(((await res.json()) as { tickets: NonNullable<typeof tickets> }).tickets);
    });
  }
  useEffect(() => { load(); }, [status, q]);

  async function onSubmit(formData: FormData) {
    setError("");
    const res = await fetch("/api/dashboard/tickets", { method: "POST", body: formData });
    const data = (await res.json()) as { error?: string; ticketId?: string };
    if (!res.ok || !data.ticketId) {
      setError(data.error || "Ticket was not created.");
      return;
    }
    setCreated(data.ticketId);
    load();
  }

  return (
    <div className="cp-grid cp-split">
      <section className="cp-card">
        <div className="cp-row-actions">
          <input placeholder="Search tickets" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Ticket status">
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_customer">Waiting for Customer</option>
            <option value="answered">Answered</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        {!tickets ? <Skeleton /> : tickets.length === 0 ? <Empty title="No support tickets" copy="Questions about orders, payments, or your account start here." /> : tickets.map((ticket) => (
          <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="cp-service">
            <strong>{ticket.subject}</strong>
            <div className="cp-meta">{ticket.id} · {ticket.status.replaceAll("_", " ")} · {ticket.priority} · {ticket.category}</div>
          </Link>
        ))}
      </section>
      <form className="cp-card" action={(formData) => void onSubmit(formData)}>
        <h3>New ticket</h3>
        {error ? <p className="cp-error">{error}</p> : null}
        {created ? <p className="cp-ok">Ticket {created} created. <Link href={`/dashboard/tickets/${created}`}>Open it</Link></p> : null}
        <label className="cp-field"><span>Subject</span><input name="subject" required /></label>
        <label className="cp-field"><span>Category</span>
          <select name="category" defaultValue="general">
            <option value="order">Order Issue</option>
            <option value="payment">Payment Issue</option>
            <option value="service">Service Issue</option>
            <option value="account">Account Issue</option>
            <option value="general">General Inquiry</option>
          </select>
        </label>
        <label className="cp-field"><span>Related order ID</span><input name="orderId" /></label>
        <label className="cp-field"><span>Priority</span>
          <select name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="cp-field"><span>Message</span><textarea name="message" rows={5} required /></label>
        <label className="cp-field"><span>Attachment</span><input name="attachment" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" /></label>
        <button className="cp-btn" type="submit">Submit ticket</button>
      </form>
    </div>
  );
}

export function TicketThreadView({ id }: { id: string }) {
  const [ticket, setTicket] = useState<{ id: string; subject: string; status: string; messages: { id: string; author: string; body: string; createdAt: string; attachmentId?: string; attachmentName?: string }[] } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const res = await fetch(`/api/dashboard/tickets/${id}`);
    if (res.ok) setTicket(((await res.json()) as { ticket: NonNullable<typeof ticket> }).ticket);
  }
  useEffect(() => { void load(); }, [id]);
  async function reply() {
    const res = await fetch(`/api/dashboard/tickets/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
    const data = (await res.json()) as { error?: string; ticket?: NonNullable<typeof ticket> };
    if (!res.ok) { setError(data.error || "Reply failed."); return; }
    setMessage("");
    setTicket(data.ticket || null);
  }
  async function reopen() {
    const res = await fetch(`/api/dashboard/tickets/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reopen: true }) });
    if (res.ok) setTicket(((await res.json()) as { ticket: NonNullable<typeof ticket> }).ticket);
  }
  if (!ticket) return <Skeleton />;
  return (
    <section className="cp-card">
      <h2>{ticket.subject}</h2>
      <p>Status {ticket.status.replaceAll("_", " ")}</p>
      {ticket.messages.map((item) => (
        <article key={item.id} className="cp-service">
          <strong>{item.author === "customer" ? "You" : "Support"}</strong>
          <p>{item.body}</p>
          <small>{item.createdAt}</small>
          {item.attachmentId ? <p><a href={`/api/dashboard/tickets/${ticket.id}?file=${item.attachmentId}`}>{item.attachmentName || "Attachment"}</a></p> : null}
        </article>
      ))}
      {error ? <p className="cp-error">{error}</p> : null}
      {ticket.status === "closed" ? <button className="cp-btn" type="button" onClick={() => void reopen()}>Reopen ticket</button> : (
        <>
          <label className="cp-field"><span>Reply</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} /></label>
          <button className="cp-btn" type="button" onClick={() => void reply()}>Send</button>
        </>
      )}
    </section>
  );
}

export function NotificationsView() {
  const [rows, setRows] = useState<{ id: string; title: string; body: string; href?: string; read: boolean; createdAt: string }[] | null>(null);
  async function load() {
    const res = await fetch("/api/dashboard/notifications");
    if (res.ok) setRows(((await res.json()) as { notifications: NonNullable<typeof rows> }).notifications);
  }
  useEffect(() => { void load(); }, []);
  async function readAll() {
    await fetch("/api/dashboard/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    await load();
  }
  if (!rows) return <Skeleton />;
  if (rows.length === 0) return <section className="cp-card"><Empty title="No notifications" copy="Order, payment, and support updates will land here." /></section>;
  return (
    <section className="cp-card">
      <button className="cp-btn-ghost" type="button" onClick={() => void readAll()}>Mark all as read</button>
      {rows.map((row) => (
        <article key={row.id} className="cp-service">
          <strong>{row.title}</strong>
          <p>{row.body}</p>
          <small>{row.read ? "Read" : "Unread"} · {row.createdAt}</small>
          {row.href ? <p><Link href={row.href}>Open</Link></p> : null}
        </article>
      ))}
    </section>
  );
}

type User = { name: string | null; email: string; image: string | null; username: string | null; timezone: string | null; createdAt: string; apiKey: string; apiKeyRevoked: boolean; balance: number };

export function ProfileView() {
  const [user, setUser] = useState<User | null>(null);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileOk, setProfileOk] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const [sessionRes, securityRes] = await Promise.all([
        fetch("/api/dashboard/session"),
        fetch("/api/dashboard/security"),
      ]);
      if (sessionRes.ok) setUser(((await sessionRes.json()) as { user: User }).user);
      if (securityRes.ok) setHasPassword(Boolean(((await securityRes.json()) as { hasPassword: boolean }).hasPassword));
    })();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError("");
    setProfileOk("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/dashboard/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), username: form.get("username"), timezone: form.get("timezone") }),
    });
    const data = (await res.json()) as { error?: string; user?: User };
    if (!res.ok || !data.user) setProfileError(data.error || "Profile was not saved.");
    else {
      setUser(data.user);
      setProfileOk("Profile saved.");
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwError("");
    setPwOk("");
    const form = new FormData(event.currentTarget);
    const next = String(form.get("next") || "");
    const confirm = String(form.get("confirm") || "");
    if (next !== confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setPwBusy(true);
    const action = hasPassword ? "password" : "set-password";
    const body = hasPassword
      ? { action, currentPassword: form.get("current"), nextPassword: next }
      : { action, nextPassword: next };
    const res = await fetch("/api/dashboard/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { error?: string };
    setPwBusy(false);
    if (!res.ok) setPwError(data.error || "Password could not be updated.");
    else {
      setHasPassword(true);
      setPwOk(
        action === "password"
          ? "Password updated. Other sessions were signed out."
          : "Panel password created. You can now sign in with email and password.",
      );
      event.currentTarget.reset();
    }
  }

  if (!user || hasPassword === null) return <Skeleton rows={3} />;

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="cp-account">
      <section className="cp-card cp-account-hero">
        <div className="cp-account-identity">
          {user.image ? (
            <img className="cp-account-avatar" src={user.image} alt="" width={72} height={72} />
          ) : (
            <span className="cp-account-avatar" aria-hidden>
              {initial}
            </span>
          )}
          <div>
            <p className="cp-kicker">Account settings</p>
            <h2 className="cp-account-name">{user.name || "Customer"}</h2>
            <p className="cp-account-email">{user.email}</p>
          </div>
        </div>
        <div className="cp-account-meta">
          <span className="cp-funds-pill is-live">Active</span>
          <span className="cp-funds-pill is-muted">Customer</span>
          <span className="cp-funds-pill is-muted">Since {user.createdAt.slice(0, 10)}</span>
        </div>
      </section>

      <div className="cp-account-grid">
        <section className="cp-card cp-glass-panel cp-account-panel">
          <header className="cp-funds-panel-head">
            <h3>Profile details</h3>
            <p>How your name appears across orders and support tickets.</p>
          </header>
          {profileError ? <p className="cp-error">{profileError}</p> : null}
          {profileOk ? <p className="cp-ok">{profileOk}</p> : null}
          <form onSubmit={(event) => void save(event)}>
            <label className="cp-field">
              <span>Full name</span>
              <input name="name" defaultValue={user.name || ""} autoComplete="name" />
            </label>
            <label className="cp-field">
              <span>Username</span>
              <input name="username" defaultValue={user.username || ""} autoComplete="username" />
            </label>
            <label className="cp-field">
              <span>Time zone</span>
              <input name="timezone" defaultValue={user.timezone || "Asia/Kathmandu"} autoComplete="off" />
            </label>
            <button className="cp-btn cp-funds-submit" type="submit">
              Save profile
            </button>
          </form>
        </section>

        <section className="cp-card cp-glass-panel cp-account-panel" id="password">
          <header className="cp-funds-panel-head">
            <h3>{hasPassword ? "Change password" : "Create panel password"}</h3>
            <p>
              {hasPassword
                ? "Banker-grade security: updating your password signs out other sessions."
                : "You signed in with Google. Set a password to also sign in with email on this panel."}
            </p>
          </header>
          {pwError ? <p className="cp-error">{pwError}</p> : null}
          {pwOk ? <p className="cp-ok">{pwOk}</p> : null}
          <form onSubmit={(event) => void changePassword(event)}>
            {hasPassword ? (
              <label className="cp-field">
                <span>Current password</span>
                <input name="current" type="password" autoComplete="current-password" required />
              </label>
            ) : null}
            <label className="cp-field">
              <span>{hasPassword ? "New password" : "Password"}</span>
              <input name="next" type="password" autoComplete="new-password" minLength={8} required placeholder="Minimum 8 characters" />
            </label>
            <label className="cp-field">
              <span>Confirm password</span>
              <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button className="cp-btn cp-funds-submit" type="submit" disabled={pwBusy}>
              {pwBusy ? "Saving…" : hasPassword ? "Update password" : "Create password"}
            </button>
          </form>
          <ul className="cp-funds-trust cp-account-trust">
            <li>Never share your password or API key</li>
            <li>Use a unique password for this panel</li>
          </ul>
          <Link className="cp-btn-ghost cp-funds-link" href="/dashboard/security">
            Sessions &amp; security center →
          </Link>
        </section>
      </div>
    </div>
  );
}

export function SecurityView() {
  const [info, setInfo] = useState<{ hasPassword: boolean; twoFactor: string; logins: { id: string; method: string; createdAt: string; ip: string }[] } | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/dashboard/security").then(async (res) => { if (res.ok) setInfo(await res.json()); }); }, []);
  async function password(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/dashboard/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "password", currentPassword: form.get("current"), nextPassword: form.get("next") }),
    });
    const data = (await res.json()) as { error?: string };
    setMessage(data.error || "Password updated. Other sessions were signed out.");
  }
  async function logoutOthers() {
    const res = await fetch("/api/dashboard/security", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout-others" }) });
    setMessage(res.ok ? "Other sessions were signed out." : "Could not update sessions.");
  }
  if (!info) return <Skeleton />;
  return (
    <div className="cp-grid">
      <section className="cp-card">
        <h3>Password</h3>
        {info.hasPassword ? (
          <form onSubmit={(event) => void password(event)}>
            <label className="cp-field"><span>Current password</span><input name="current" type="password" /></label>
            <label className="cp-field"><span>New password</span><input name="next" type="password" /></label>
            <button className="cp-btn" type="submit">Change password</button>
          </form>
        ) : <p>This account signs in with Google. Password change is available after an email password is set.</p>}
        <h3>Sessions</h3>
        <button className="cp-btn-ghost" type="button" onClick={() => void logoutOthers()}>Log out other sessions</button>
        <h3>Two-factor authentication</h3>
        <p>Authenticator app setup is not configured on this account yet.</p>
        {message ? <p>{message}</p> : null}
      </section>
      <section className="cp-card">
        <h3>Login history</h3>
        {info.logins.length === 0 ? <Empty title="No login history yet" copy="New sign-ins are recorded from this point on." /> : info.logins.map((row) => (
          <p key={row.id}>{row.createdAt} · {row.method} · {row.ip}</p>
        ))}
      </section>
    </div>
  );
}

export function ApiDocsView() {
  const [user, setUser] = useState<User | null>(null);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { void fetch("/api/dashboard/session").then(async (res) => { if (res.ok) setUser(((await res.json()) as { user: User }).user); }); }, []);
  async function act(action: "regenerate" | "revoke") {
    if (action === "regenerate" && !window.confirm("Replace the API key? Existing integrations will stop until they use the new key.")) return;
    const res = await fetch("/api/dashboard/api-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const data = (await res.json()) as { error?: string; user?: User };
    if (!res.ok || !data.user) { setMessage(data.error || "Request failed."); return; }
    setUser(data.user);
    setShow(action === "regenerate");
    setMessage(action === "regenerate" ? "New key generated. Copy it now." : "Key revoked. Orders and API calls are blocked until you regenerate.");
  }
  if (!user) return <Skeleton />;
  const masked = `${user.apiKey.slice(0, 8)}…${user.apiKey.slice(-4)}`;
  return (
    <div className="cp-grid">
      <section className="cp-card">
        <h3>API key</h3>
        <p>Endpoint <code>https://trustifysmm.com/api/v2</code></p>
        <p>{user.apiKeyRevoked ? "Revoked" : show ? user.apiKey : masked}</p>
        <div className="cp-row-actions">
          <button className="cp-btn-ghost" type="button" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Reveal"}</button>
          <button className="cp-btn-ghost" type="button" onClick={() => void navigator.clipboard.writeText(user.apiKey)}>Copy</button>
          <button className="cp-btn" type="button" onClick={() => void act("regenerate")}>Regenerate</button>
          <button className="cp-btn-ghost" type="button" onClick={() => void act("revoke")}>Revoke</button>
        </div>
        {message ? <p>{message}</p> : null}
        <p className="cp-note">The key authenticates your panel API. It is stored so the server can match requests. Treat it like a password.</p>
      </section>
      {apiDocEndpoints.map((endpoint) => (
        <article key={endpoint.id} className="cp-card">
          <h3>{endpoint.title}</h3>
          <p>{endpoint.method} {endpoint.path}{endpoint.action ? ` · action=${endpoint.action}` : ""}</p>
          <p>{endpoint.summary}</p>
          <pre>{endpoint.curlExample}</pre>
          <pre>{endpoint.responseExample}</pre>
        </article>
      ))}
    </div>
  );
}
