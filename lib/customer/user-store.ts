import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { CustomerUser } from "@/lib/customer/types";
import { hashPassword, verifyPassword } from "@/lib/customer/password";
import { ensureDemoAccount } from "@/lib/customer/demo-sync";

const STORE_PATH = path.join(process.cwd(), "data", "runtime", "customers.json");

type StoreFile = { users: CustomerUser[] };

async function loadStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreFile;
  } catch {
    const initial: StoreFile = { users: [] };
    await saveStore(initial);
    return initial;
  }
}

async function saveStore(store: StoreFile) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function newId() {
  return `usr_${randomBytes(12).toString("hex")}`;
}

function newApiKey() {
  return `tsm_${randomBytes(24).toString("hex")}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getUserById(id: string) {
  const store = await loadStore();
  return store.users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string) {
  const store = await loadStore();
  const e = normalizeEmail(email);
  return store.users.find((u) => u.email === e) ?? null;
}

export async function listCustomers() {
  const store = await loadStore();
  return store.users.map((user) => ({ ...user }));
}

export async function getUserByApiKey(apiKey: string) {
  const store = await loadStore();
  return store.users.find((user) => user.apiKey === apiKey) ?? null;
}

export async function getUserByGoogleId(googleId: string) {
  const store = await loadStore();
  return store.users.find((u) => u.googleId === googleId) ?? null;
}

export async function persistCustomer(user: CustomerUser) {
  const store = await loadStore();
  const idx = store.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) store.users[idx] = user;
  else store.users.push(user);
  await saveStore(store);
  return user;
}

export async function registerWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user?: CustomerUser; error?: string }> {
  const email = normalizeEmail(input.email);
  if (!email.includes("@")) return { error: "Invalid email." };

  const store = await loadStore();
  const existing = store.users.find((u) => u.email === email);
  if (existing) {
    if (existing.googleId && !existing.passwordHash) {
      return { error: "This email is registered with Google. Continue with Google instead." };
    }
    return { error: "An account with this email already exists. Sign in instead." };
  }

  const now = new Date().toISOString();
  const user: CustomerUser = {
    id: newId(),
    email,
    emailVerified: null,
    name: input.name.trim() || null,
    image: null,
    passwordHash: hashPassword(input.password),
    googleId: null,
    role: "CUSTOMER",
    apiKey: newApiKey(),
    balance: 0,
    createdAt: now,
    updatedAt: now,
  };
  await persistCustomer(user);
  await ensureDemoAccount(user.email, user.apiKey, user.balance);
  return { user };
}

export async function loginWithEmail(email: string, password: string): Promise<{ user?: CustomerUser; error?: string }> {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    return { error: "Invalid email or password." };
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }
  if (user.suspended) return { error: "This account is suspended." };
  return { user };
}

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function loginOrRegisterWithGoogle(
  profile: GoogleProfile,
): Promise<{ user?: CustomerUser; error?: string; created?: boolean }> {
  if (!profile.email_verified) {
    return { error: "Google email is not verified." };
  }
  const email = normalizeEmail(profile.email);
  const byGoogle = await getUserByGoogleId(profile.sub);
  if (byGoogle) {
    if (byGoogle.suspended) return { error: "This account is suspended." };
    const updated = await touchGoogleProfile(byGoogle, profile);
    return { user: updated, created: false };
  }

  const byEmail = await getUserByEmail(email);
  if (byEmail) {
    if (byEmail.suspended) return { error: "This account is suspended." };
    if (byEmail.googleId && byEmail.googleId !== profile.sub) {
      return { error: "This email is linked to a different Google account." };
    }
    byEmail.googleId = profile.sub;
    byEmail.emailVerified = new Date().toISOString();
    if (!byEmail.name && profile.name) byEmail.name = profile.name;
    if (!byEmail.image && profile.picture) byEmail.image = profile.picture;
    byEmail.updatedAt = new Date().toISOString();
    await persistCustomer(byEmail);
    await ensureDemoAccount(byEmail.email, byEmail.apiKey, byEmail.balance);
    return { user: byEmail, created: false };
  }

  const now = new Date().toISOString();
  const user: CustomerUser = {
    id: newId(),
    email,
    emailVerified: now,
    name: profile.name?.trim() || null,
    image: profile.picture || null,
    passwordHash: null,
    googleId: profile.sub,
    role: "CUSTOMER",
    apiKey: newApiKey(),
    balance: 0,
    createdAt: now,
    updatedAt: now,
  };
  await persistCustomer(user);
  await ensureDemoAccount(user.email, user.apiKey, user.balance);
  return { user, created: true };
}

async function touchGoogleProfile(user: CustomerUser, profile: GoogleProfile) {
  let changed = false;
  if (profile.name && user.name !== profile.name) {
    user.name = profile.name;
    changed = true;
  }
  if (profile.picture && user.image !== profile.picture) {
    user.image = profile.picture;
    changed = true;
  }
  if (changed) {
    user.updatedAt = new Date().toISOString();
    await persistCustomer(user);
  }
  await ensureDemoAccount(user.email, user.apiKey, user.balance);
  return user;
}

export function toPublicUser(user: CustomerUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    apiKey: user.apiKey,
    apiKeyRevoked: Boolean(user.apiKeyRevoked),
    balance: user.balance,
    username: user.username ?? null,
    timezone: user.timezone ?? null,
    createdAt: user.createdAt,
  };
}

export async function updateCustomerProfile(
  userId: string,
  input: { name?: string; username?: string; timezone?: string },
): Promise<{ user?: CustomerUser; error?: string }> {
  const user = await getUserById(userId);
  if (!user) return { error: "Account not found." };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) return { error: "Name must be 2–80 characters." };
    user.name = name;
  }
  if (input.username !== undefined) {
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      return { error: "Username must be 3–24 letters, numbers, or underscores." };
    }
    const store = await loadStore();
    const taken = store.users.find((u) => u.username === username && u.id !== user.id);
    if (taken) return { error: "That username is already taken." };
    user.username = username;
  }
  if (input.timezone !== undefined) {
    const timezone = input.timezone.trim();
    if (timezone.length > 64) return { error: "Time zone is too long." };
    user.timezone = timezone || null;
  }
  user.updatedAt = new Date().toISOString();
  await persistCustomer(user);
  return { user };
}

export async function changeCustomerPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
): Promise<{ user?: CustomerUser; error?: string }> {
  const user = await getUserById(userId);
  if (!user) return { error: "Account not found." };
  if (!user.passwordHash) {
    return { error: "This account uses Google sign-in. Set a password from a linked email account first." };
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) return { error: "Current password is incorrect." };
  if (nextPassword.length < 8) return { error: "New password must be at least 8 characters." };
  user.passwordHash = hashPassword(nextPassword);
  user.sessionVersion = Date.now();
  user.updatedAt = new Date().toISOString();
  await persistCustomer(user);
  return { user };
}

export async function bumpSessionVersion(userId: string) {
  const user = await getUserById(userId);
  if (!user) return null;
  user.sessionVersion = Date.now();
  user.updatedAt = new Date().toISOString();
  await persistCustomer(user);
  return user;
}

export async function replaceCustomerApiKey(userId: string, nextKey: string, revoked = false) {
  const user = await getUserById(userId);
  if (!user) return null;
  user.apiKey = nextKey;
  user.apiKeyRevoked = revoked;
  user.updatedAt = new Date().toISOString();
  await persistCustomer(user);
  return user;
}