import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const STORAGE_ROOT = path.resolve(process.cwd(), process.env.STORAGE_PATH || "./storage");

/** Absolute path on disk for a storage-relative path, guarded against traversal. */
export function resolveStoragePath(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  const abs = path.resolve(STORAGE_ROOT, clean);
  if (abs !== STORAGE_ROOT && !abs.startsWith(STORAGE_ROOT + path.sep)) {
    throw new Error("Invalid storage path");
  }
  return abs;
}

/** Writes bytes under STORAGE_PATH and returns an app URL to fetch them. */
export async function saveFile(
  relativePath: string,
  data: Buffer,
): Promise<string> {
  const abs = resolveStoragePath(relativePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return fileUrl(relativePath);
}

export async function readFile(relativePath: string): Promise<Buffer> {
  return fs.readFile(resolveStoragePath(relativePath));
}

/** Public URL served by /api/files/[...path]. */
export function fileUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  return `/api/files/${clean}`;
}

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
};

export function contentTypeFor(relativePath: string): string {
  return CONTENT_TYPES[path.extname(relativePath).toLowerCase()] ?? "application/octet-stream";
}
