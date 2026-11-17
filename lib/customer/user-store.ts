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

export async function getUserByGoogleId(googleId: string) {
  const store = await loadStore();
  return store.users.find((u) => u.googleId === googleId) ?? null;
}

async function persistUser(user: CustomerUser) {
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
  await persistUser(user);
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
    const updated = await touchGoogleProfile(byGoogle, profile);
    return { user: updated, created: false };
  }

  const byEmail = await getUserByEmail(email);
  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== profile.sub) {
      return { error: "This email is linked to a different Google account." };
    }
    byEmail.googleId = profile.sub;
    byEmail.emailVerified = new Date().toISOString();
    if (!byEmail.name && profile.name) byEmail.name = profile.name;
    if (!byEmail.image && profile.picture) byEmail.image = profile.picture;
    byEmail.updatedAt = new Date().toISOString();
    await persistUser(byEmail);
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
  await persistUser(user);
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
    await persistUser(user);
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
    balance: user.balance,
  };
}