"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Empty, Skeleton } from "@/components/dashboard/OverviewView";
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

function AuthenticatorMark() {
  return (
    <span className="cp-auth-logo" aria-hidden>
      <svg viewBox="0 0 24 24">
        <path fill="#4285F4" d="M6.957 1.3379A2.0133 2.0133 0 0 0 6 1.6074c-.967.5583-1.2985 1.7947-.7402 2.7617L8.498 9.9785H2.0215C.9049 9.9785 0 10.8835 0 12c0 1.1166.905 2.0215 2.0215 2.0215H8.498l-3.2382 5.6094c-.5583.967-.2268 2.2034.7402 2.7617.967.5582 2.2034.2267 2.7617-.7403L12 16.045l3.2383 5.6074c.5583.967 1.7947 1.2985 2.7617.7403.967-.5583 1.2985-1.7947.7402-2.7617l-3.2382-5.6094h6.4765C23.0951 14.0215 24 13.1165 24 12c0-1.1166-.905-2.0215-2.0215-2.0215H15.502l3.2382-5.6094c.5583-.967.2268-2.2034-.7402-2.7617-.967-.5582-2.2034-.2267-2.7617.7403L12 7.955 8.7617 2.3477C8.378 1.6829 7.674 1.3193 6.957 1.3379Zm9.959 1.0058c.1932-.0127.3928.0317.5781.1387.4944.2854.6565.8866.3711 1.3809l-4.1132 7.125h8.2265c.5709 0 1.0117.4408 1.0117 1.0117s-.4408 1.0117-1.0117 1.0117H14.92l-1.168-2.0234-1.168-2.0235 3.5294-6.1113c.1783-.3089.4808-.4885.8027-.5098zm-9.9336.004c.3587-.0093.7081.166.9043.5058l3.5293 6.1113-1.168 2.0235-1.168 2.0234H2.0216c-.5709 0-1.0117-.4408-1.0117-1.0117s.4408-1.0117 1.0117-1.0117h8.2265l-4.1132-7.125c-.2854-.4943-.1233-1.0955.371-1.3809a.9891.9891 0 0 1 .4766-.1347ZM9.666 14.0215h4.668l3.5312 6.1152c.2854.4943.1233 1.0955-.371 1.3809-.4942.2852-1.0956.1231-1.381-.3711L12 14.0254l-4.1133 7.121c-.2853.4943-.8867.6564-1.3808.3712-.4944-.2854-.6565-.8866-.3711-1.3809Z" />
      </svg>
    </span>
  );
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

type SecurityInfo = {
  hasPassword: boolean;
  twoFactor: { enabled: boolean; activatedAt: string | null };
  logins: { id: string; method: string; createdAt: string; ip: string }[];
};

export function SecurityView() {
  const [info, setInfo] = useState<SecurityInfo | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [secret, setSecret] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  function load() {
    void fetch("/api/dashboard/security").then(async (res) => { if (res.ok) setInfo(await res.json()); });
  }
  useEffect(() => { load(); }, []);

  async function post(body: Record<string, string>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/dashboard/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; secret?: string; recoveryCodes?: string[]; twoFactor?: SecurityInfo["twoFactor"] };
      if (!res.ok) {
        setError(data.error || "Request failed.");
        return data;
      }
      if (data.secret) setSecret(data.secret);
      if (data.recoveryCodes) setCodes(data.recoveryCodes);
      if (data.twoFactor) setInfo((current) => current ? { ...current, twoFactor: data.twoFactor! } : current);
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function password(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = await post({ action: "password", currentPassword: String(form.get("current") || ""), nextPassword: String(form.get("next") || "") });
    if (data && !data.error) setMessage("Password updated. Other sessions were signed out.");
  }
  async function startSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passwordValue = String(new FormData(event.currentTarget).get("current") || "");
    const data = await post({ action: "totp-start", currentPassword: passwordValue });
    if (data?.secret) setMessage("Add this setup key in Google Authenticator, then enter the 6-digit code.");
  }
  async function confirmSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") || "");
    const data = await post({ action: "totp-confirm", code });
    if (data?.recoveryCodes) {
      setSecret("");
      setMessage("Authenticator is on. Save these recovery codes now. They are shown once.");
      load();
    }
  }
  async function disable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = await post({
      action: "totp-disable",
      currentPassword: String(form.get("current") || ""),
      code: String(form.get("code") || ""),
      recoveryCode: String(form.get("recovery") || ""),
    });
    if (data && !data.error) {
      setConfirmDisable(false);
      setCodes(null);
      setMessage("Authenticator is off. New sign-ins no longer ask for a code.");
      load();
    }
  }
  async function regenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = await post({ action: "totp-regenerate", currentPassword: String(form.get("current") || ""), code: String(form.get("code") || "") });
    if (data?.recoveryCodes) setMessage("New recovery codes are ready. The old codes no longer work.");
  }

  if (!info) return <Skeleton />;
  const enabled = info.twoFactor.enabled;
  return (
    <div className="cp-security">
      <section className="cp-card cp-auth-card">
        <div className="cp-auth-head">
          <AuthenticatorMark />
          <div>
            <p className="cp-kicker">Authenticator app</p>
            <h2>Google Authenticator</h2>
            <p className="cp-auth-status">{enabled ? "Enabled" : "Not enabled"}{enabled && info.twoFactor.activatedAt ? ` · ${formatWhen(info.twoFactor.activatedAt)}` : ""}</p>
          </div>
        </div>
        <p className="cp-auth-lead">Every new sign-in asks for the 6-digit code from the Google Authenticator app. You type a setup key. There is no QR code.</p>
        {!enabled && !secret ? (
          <form className="cp-auth-enable" onSubmit={(event) => void startSetup(event)}>
            {info.hasPassword ? (
              <label className="cp-field"><span>Current password</span><input name="current" type="password" autoComplete="current-password" required /></label>
            ) : null}
            <button className="cp-btn" type="submit" disabled={busy}>{busy ? "Starting…" : "Enable"}</button>
          </form>
        ) : null}
        {secret ? (
          <form className="cp-auth-setup" onSubmit={(event) => void confirmSetup(event)}>
            <ol>
              <li>Open Google Authenticator and choose Add account.</li>
              <li>Choose Enter a setup key.</li>
              <li>Account name: TrustifySMM. Key: the value below. Type: Time-based.</li>
              <li>Enter the 6-digit code shown in the app.</li>
            </ol>
            <p className="cp-api-key">{secret}</p>
            <button className="cp-btn-ghost" type="button" onClick={() => void navigator.clipboard.writeText(secret)}>Copy setup key</button>
            <label className="cp-field"><span>6-digit code</span><input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required /></label>
            <button className="cp-btn" type="submit" disabled={busy}>{busy ? "Checking…" : "Activate"}</button>
          </form>
        ) : null}
        {codes ? (
          <div className="cp-auth-codes">
            <p>Save these codes now. Each one works once, and they are not shown again.</p>
            <pre className="cp-api-key">{codes.join("\n")}</pre>
            <div className="cp-row-actions">
              <button className="cp-btn-ghost" type="button" onClick={() => void navigator.clipboard.writeText(codes.join("\n"))}>Copy codes</button>
              <button className="cp-btn-ghost" type="button" onClick={() => downloadFile("trustifysmm-recovery-codes.txt", `TrustifySMM recovery codes\n\n${codes.join("\n")}\n`, "text/plain")}>Download codes</button>
            </div>
          </div>
        ) : null}
        {enabled ? (
          <div className="cp-auth-manage">
            <form onSubmit={(event) => void regenerate(event)}>
              <h3>Recovery codes</h3>
              <p>Replacing the codes turns off every unused code from the previous set.</p>
              {info.hasPassword ? <label className="cp-field"><span>Current password</span><input name="current" type="password" autoComplete="current-password" required /></label> : null}
              <label className="cp-field"><span>6-digit code</span><input name="code" inputMode="numeric" autoComplete="one-time-code" required /></label>
              <button className="cp-btn-ghost" type="submit" disabled={busy}>Regenerate recovery codes</button>
            </form>
            {confirmDisable ? (
              <form onSubmit={(event) => void disable(event)}>
                <h3>Turn authenticator off?</h3>
                <p>New sign-ins will no longer ask for a code. Enter a current code or one unused recovery code.</p>
                {info.hasPassword ? <label className="cp-field"><span>Current password</span><input name="current" type="password" autoComplete="current-password" required /></label> : null}
                <label className="cp-field"><span>6-digit code</span><input name="code" inputMode="numeric" autoComplete="one-time-code" /></label>
                <label className="cp-field"><span>Or a recovery code</span><input name="recovery" autoComplete="off" /></label>
                <div className="cp-row-actions">
                  <button className="cp-btn" type="submit" disabled={busy}>Disable</button>
                  <button className="cp-btn-ghost" type="button" onClick={() => setConfirmDisable(false)}>Cancel</button>
                </div>
              </form>
            ) : <button className="cp-btn-ghost" type="button" onClick={() => setConfirmDisable(true)}>Disable</button>}
          </div>
        ) : null}
        {error ? <p className="cp-error">{error}</p> : null}
        {message ? <p className="cp-ok">{message}</p> : null}
        <p className="cp-note">Lost the phone and the recovery codes? Email support@trustifysmm.com from the account address.</p>
      </section>

      {info.hasPassword ? (
        <section className="cp-card">
          <h3>Password</h3>
          <form onSubmit={(event) => void password(event)}>
            <label className="cp-field"><span>Current password</span><input name="current" type="password" autoComplete="current-password" required /></label>
            <label className="cp-field"><span>New password</span><input name="next" type="password" autoComplete="new-password" minLength={8} required /></label>
            <button className="cp-btn" type="submit" disabled={busy}>Change password</button>
          </form>
        </section>
      ) : null}

      <section className="cp-card">
        <h3>Login history</h3>
        {info.logins.length === 0 ? <Empty title="No login history yet" copy="New sign-ins are recorded from this point on." /> : (
          <div className="cp-table-wrap">
            <table className="cp-table cp-login-table">
              <thead><tr><th>When</th><th>Method</th><th>Address</th></tr></thead>
              <tbody>
                {info.logins.map((row) => (
                  <tr key={row.id}>
                    <td data-label="When">{formatWhen(row.createdAt)}</td>
                    <td data-label="Method"><span className="cp-login-method">{row.method === "google" ? "Google" : "Password"}</span></td>
                    <td data-label="Address">{row.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const API_URL = "https://trustifysmm.com/api/v2";

function downloadFile(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function phpExample(key: string) {
  const quotedKey = JSON.stringify(key);
  const dollar = "$";
  return `<?php
/**
 * TrustifySMM API example.
 * Put this file on any server with PHP and cURL.
 * Orders use the key below and the charge leaves that wallet.
 */

${dollar}apiKey = ${quotedKey};
${dollar}apiUrl = ${JSON.stringify(API_URL)};

function trustify(array ${dollar}params): array {
    ${dollar}ch = curl_init(${JSON.stringify(API_URL)});
    curl_setopt_array(${dollar}ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query(array_merge(['key' => ${quotedKey}], ${dollar}params)),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
    ]);
    ${dollar}raw = curl_exec(${dollar}ch);
    curl_close(${dollar}ch);
    ${dollar}data = json_decode((string) ${dollar}raw, true);
    return is_array(${dollar}data) ? ${dollar}data : ['error' => 'Invalid response'];
}

// 1. Wallet balance
print_r(trustify(['action' => 'balance']));

// 2. Service list. Use the "service" number in the next call.
// print_r(trustify(['action' => 'services']));

// 3. Place an order. The charge is taken from this key's wallet.
// print_r(trustify([
//     'action' => 'add',
//     'service' => '10001',
//     'link' => 'https://example.com/your-link',
//     'quantity' => '100',
// ]));
`;
}

function textExample(key: string) {
  return `TrustifySMM API
Endpoint: ${API_URL}
Method: POST
Key: ${key}

Every call is form data with key and action.
An order is charged to the wallet that owns this key.

Balance
curl -X POST "${API_URL}" -d "key=${key}" -d "action=balance"

Services
curl -X POST "${API_URL}" -d "key=${key}" -d "action=services"

Add order
curl -X POST "${API_URL}" \\
  -d "key=${key}" \\
  -d "action=add" \\
  -d "service=10001" \\
  -d "link=https://example.com/your-link" \\
  -d "quantity=100"

The response is { "order": 1100 }.
That number is your order id. The charge has already left the wallet.

Status
curl -X POST "${API_URL}" -d "key=${key}" -d "action=status" -d "order=1100"

Cancel
curl -X POST "${API_URL}" -d "key=${key}" -d "action=cancel" -d "orders=1100"
`;
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
    setMessage(action === "regenerate" ? "New key generated. Download the PHP or text example and use this key." : "Key revoked. Generate a new key before connecting again.");
  }
  if (!user) return <Skeleton />;
  const masked = `${user.apiKey.slice(0, 8)}…${user.apiKey.slice(-4)}`;
  const visibleKey = user.apiKeyRevoked ? "" : user.apiKey;
  return (
    <div className="cp-api">
      <section className="cp-card">
        <p className="cp-kicker">Your API</p>
        <h3>Generate a key and connect</h3>
        <p>The endpoint is <code>{API_URL}</code>. A call with this key places the order on your account and takes the charge from this wallet.</p>
        <p className="cp-api-key">{user.apiKeyRevoked ? "Revoked. Generate a new key." : show ? user.apiKey : masked}</p>
        <div className="cp-row-actions">
          <button className="cp-btn" type="button" onClick={() => void act("regenerate")}>Generate new key</button>
          <button className="cp-btn-ghost" type="button" onClick={() => setShow((value) => !value)} disabled={user.apiKeyRevoked}>{show ? "Hide" : "Reveal"}</button>
          <button className="cp-btn-ghost" type="button" disabled={!visibleKey} onClick={() => void navigator.clipboard.writeText(user.apiKey)}>Copy key</button>
          <button className="cp-btn-ghost" type="button" disabled={user.apiKeyRevoked} onClick={() => void act("revoke")}>Revoke</button>
        </div>
        {message ? <p>{message}</p> : null}
      </section>

      <section className="cp-card">
        <p className="cp-kicker">Install</p>
        <h3>How to connect</h3>
        <ol className="cp-api-steps">
          <li>Generate the key on this page. It belongs to this login only.</li>
          <li>Download the PHP file or the text example. Both already contain this key.</li>
          <li>PHP needs cURL. Upload <code>trustifysmm-api.php</code> and open it, or run <code>php trustifysmm-api.php</code>.</li>
          <li>Send <code>action=services</code> to read the service numbers, then <code>action=add</code> with the service, link and quantity.</li>
          <li>The response order number is your order. The same amount is removed from the wallet shown in this dashboard.</li>
        </ol>
        <div className="cp-row-actions">
          <button className="cp-btn" type="button" disabled={!visibleKey} onClick={() => downloadFile("trustifysmm-api.php", phpExample(user.apiKey), "application/x-php")}>Download PHP file</button>
          <button className="cp-btn-ghost" type="button" disabled={!visibleKey} onClick={() => downloadFile("trustifysmm-api.txt", textExample(user.apiKey), "text/plain")}>Download text example</button>
          <a className="cp-btn-ghost" href="/downloads/trustifysmm-api-client.php" download>Download PHP class</a>
        </div>
        <p className="cp-note">The PHP class is the same client without your key filled in. Paste the key into <code>YOUR_API_KEY</code>. Do not send the key to anyone else. A revoked key cannot place orders.</p>
      </section>

      <section className="cp-card">
        <h3>Actions</h3>
        <div className="cp-table-wrap">
          <table className="cp-table">
            <thead><tr><th>Action</th><th>What it does</th><th>Required fields</th></tr></thead>
            <tbody>
              <tr><td data-label="Action">services</td><td data-label="What it does">Service numbers, names, rates, min and max.</td><td data-label="Required">key, action</td></tr>
              <tr><td data-label="Action">add</td><td data-label="What it does">Places the order and charges this wallet.</td><td data-label="Required">key, action, service, link, quantity</td></tr>
              <tr><td data-label="Action">status</td><td data-label="What it does">Charge, status and remains for one of your orders.</td><td data-label="Required">key, action, order</td></tr>
              <tr><td data-label="Action">balance</td><td data-label="What it does">Wallet balance for this key.</td><td data-label="Required">key, action</td></tr>
              <tr><td data-label="Action">cancel</td><td data-label="What it does">Cancels one of your orders and returns the charge when the cancel is accepted.</td><td data-label="Required">key, action, orders</td></tr>
              <tr><td data-label="Action">refill</td><td data-label="What it does">Asks for a refill on one of your orders.</td><td data-label="Required">key, action, order</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
