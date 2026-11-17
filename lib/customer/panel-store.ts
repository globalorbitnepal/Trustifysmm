import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { withStoreLock } from "@/lib/runtime-lock";

export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "answered" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketCategory = "order" | "payment" | "service" | "account" | "general";

export type TicketMessage = {
  id: string;
  author: "customer" | "support";
  body: string;
  createdAt: string;
  attachmentId?: string;
  attachmentName?: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type PanelNotification = {
  id: string;
  userId: string;
  type:
    | "order_created"
    | "order_completed"
    | "order_processing"
    | "deposit_received"
    | "payment_confirmed"
    | "payment_failed"
    | "support_reply"
    | "security";
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

export type LoginEvent = {
  id: string;
  userId: string;
  method: "password" | "google";
  createdAt: string;
  ip: string;
};

type PanelFile = {
  tickets: SupportTicket[];
  notifications: PanelNotification[];
  favorites: { userId: string; serviceId: number }[];
  logins: LoginEvent[];
  audits: { id: string; userId: string; action: string; createdAt: string }[];
};

const STORE_PATH = path.join(process.cwd(), "data", "runtime", "customer-panel.json");

function empty(): PanelFile {
  return { tickets: [], notifications: [], favorites: [], logins: [], audits: [] };
}

async function load(): Promise<PanelFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as PanelFile;
    parsed.tickets ??= [];
    parsed.notifications ??= [];
    parsed.favorites ??= [];
    parsed.logins ??= [];
    parsed.audits ??= [];
    return parsed;
  } catch {
    const initial = empty();
    await save(initial);
    return initial;
  }
}

async function save(store: PanelFile) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function nid(prefix: string) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

export async function addNotification(input: Omit<PanelNotification, "id" | "read" | "createdAt">) {
  return withStoreLock(async () => {
    const store = await load();
    const row: PanelNotification = {
      ...input,
      id: nid("ntf"),
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.notifications.push(row);
    await save(store);
    return row;
  });
}

export async function listNotifications(userId: string) {
  const store = await load();
  return store.notifications
    .filter((row) => row.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  return withStoreLock(async () => {
    const store = await load();
    for (const row of store.notifications) {
      if (row.userId !== userId) continue;
      if (!ids || ids.includes(row.id)) row.read = true;
    }
    await save(store);
  });
}

export async function createTicket(input: {
  userId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  orderId?: string;
  message: string;
  attachment?: { id: string; name: string };
}) {
  return withStoreLock(async () => {
    const store = await load();
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: `TCK-${randomBytes(4).toString("hex").toUpperCase()}`,
      userId: input.userId,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      status: "open",
      orderId: input.orderId,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: nid("msg"),
          author: "customer",
          body: input.message,
          createdAt: now,
          attachmentId: input.attachment?.id,
          attachmentName: input.attachment?.name,
        },
      ],
    };
    store.tickets.push(ticket);
    await save(store);
    return ticket;
  });
}

export async function listTickets(userId: string) {
  const store = await load();
  return store.tickets
    .filter((ticket) => ticket.userId === userId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getTicket(userId: string, ticketId: string) {
  const store = await load();
  return store.tickets.find((ticket) => ticket.userId === userId && ticket.id === ticketId) ?? null;
}

export async function replyTicket(userId: string, ticketId: string, body: string) {
  return withStoreLock(async () => {
    const store = await load();
    const ticket = store.tickets.find((row) => row.userId === userId && row.id === ticketId);
    if (!ticket) return { error: "Ticket not found." as const };
    if (ticket.status === "closed") return { error: "This ticket is closed. Reopen it to reply." as const };
    const now = new Date().toISOString();
    ticket.messages.push({ id: nid("msg"), author: "customer", body, createdAt: now });
    ticket.status = "open";
    ticket.updatedAt = now;
    await save(store);
    return { ticket };
  });
}

export async function reopenTicket(userId: string, ticketId: string) {
  return withStoreLock(async () => {
    const store = await load();
    const ticket = store.tickets.find((row) => row.userId === userId && row.id === ticketId);
    if (!ticket) return { error: "Ticket not found." as const };
    if (ticket.status !== "closed") return { ticket };
    ticket.status = "open";
    ticket.updatedAt = new Date().toISOString();
    await save(store);
    return { ticket };
  });
}

export async function listFavorites(userId: string) {
  const store = await load();
  return store.favorites.filter((row) => row.userId === userId).map((row) => row.serviceId);
}

export async function toggleFavorite(userId: string, serviceId: number) {
  return withStoreLock(async () => {
    const store = await load();
    const idx = store.favorites.findIndex((row) => row.userId === userId && row.serviceId === serviceId);
    if (idx >= 0) store.favorites.splice(idx, 1);
    else store.favorites.push({ userId, serviceId });
    await save(store);
    return store.favorites.filter((row) => row.userId === userId).map((row) => row.serviceId);
  });
}

export async function recordLogin(userId: string, method: LoginEvent["method"], ip: string) {
  return withStoreLock(async () => {
    const store = await load();
    store.logins.push({
      id: nid("lin"),
      userId,
      method,
      ip: ip.slice(0, 64) || "unknown",
      createdAt: new Date().toISOString(),
    });
    store.logins = store.logins.slice(-400);
    await save(store);
  });
}

export async function listLogins(userId: string) {
  const store = await load();
  return store.logins.filter((row) => row.userId === userId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function recordAudit(userId: string, action: string) {
  return withStoreLock(async () => {
    const store = await load();
    store.audits.push({ id: nid("aud"), userId, action, createdAt: new Date().toISOString() });
    store.audits = store.audits.slice(-400);
    await save(store);
  });
}
