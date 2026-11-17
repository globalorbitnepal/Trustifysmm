import { randomBytes } from "node:crypto";

export const OAUTH_STATE_COOKIE = "google_oauth_state";

export function siteUrl() {
  return (process.env.SITE_URL?.trim() || "http://127.0.0.1:3010").replace(/\/$/, "");
}

export function googleCallbackUrl() {
  const override = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  return `${siteUrl()}/api/auth/google/callback`;
}

export function googleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function createOAuthState() {
  return randomBytes(24).toString("hex");
}

export function googleAuthUrl(state: string) {
  const cfg = googleClientConfig();
  if (!cfg) throw new Error("Google OAuth is not configured");
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: googleCallbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const cfg = googleClientConfig();
  if (!cfg) throw new Error("Google OAuth is not configured");
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: googleCallbackUrl(),
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as { id_token?: string; access_token?: string };
}

export async function verifyGoogleIdToken(idToken: string) {
  const cfg = googleClientConfig();
  if (!cfg) throw new Error("Google OAuth is not configured");
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new Error("Invalid Google ID token");
  const payload = (await res.json()) as {
    sub: string;
    email: string;
    email_verified?: string | boolean;
    name?: string;
    picture?: string;
    aud?: string;
  };
  if (payload.aud !== cfg.clientId) throw new Error("Google token audience mismatch");
  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true" || payload.email_verified === "1";
  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: emailVerified,
    name: payload.name,
    picture: payload.picture,
  };
}