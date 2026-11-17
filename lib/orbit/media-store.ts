import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type MediaItem = {
  id: string;
  name: string;
  url: string;
  alt: string;
  bytes: number;
  createdAt: string;
};

const DIR = path.join(process.cwd(), "public", "media", "orbit");
const INDEX = path.join(process.cwd(), "data", "runtime", "media-index.json");

async function readIndex(): Promise<MediaItem[]> {
  try {
    const { readFile } = await import("node:fs/promises");
    const rows = JSON.parse(await readFile(INDEX, "utf8")) as MediaItem[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export async function listMedia() {
  return readIndex();
}

export async function saveMedia(file: File, alt: string) {
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) return { error: "Upload a PNG, JPG, WEBP, or GIF image." as const };
  if (file.size > 4_000_000) return { error: "Image must be under 4 MB." as const };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const id = randomBytes(6).toString("hex");
  const name = `${id}.${ext}`;
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, name), Buffer.from(await file.arrayBuffer()));
  const item: MediaItem = {
    id,
    name: file.name,
    url: `/media/orbit/${name}`,
    alt: alt.trim() || file.name,
    bytes: file.size,
    createdAt: new Date().toISOString(),
  };
  const rows = await readIndex();
  rows.unshift(item);
  await mkdir(path.dirname(INDEX), { recursive: true });
  await writeFile(INDEX, JSON.stringify(rows, null, 2), "utf8");
  return { item };
}

export async function deleteMedia(id: string) {
  const rows = await readIndex();
  const item = rows.find((row) => row.id === id);
  if (!item) return { error: "File not found." as const };
  const next = rows.filter((row) => row.id !== id);
  await writeFile(INDEX, JSON.stringify(next, null, 2), "utf8");
  const filename = item.url.split("/").pop();
  if (filename) {
    const { unlink } = await import("node:fs/promises");
    await unlink(path.join(DIR, filename)).catch(() => undefined);
  }
  return { ok: true };
}

export async function mediaFolders() {
  try {
    const names = await readdir(DIR);
    return names.length;
  } catch {
    return 0;
  }
}
