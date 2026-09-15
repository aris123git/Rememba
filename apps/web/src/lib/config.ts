import path from "node:path";

export const APP_VERSION = "V1";

export function storageRoot(): string {
  return process.env.STORAGE_ROOT || path.resolve(process.cwd(), "../../data/storage");
}

export function aiServiceUrl(): string {
  return process.env.AI_SERVICE_URL || "http://127.0.0.1:8090";
}

export function faceMatchThreshold(): number {
  const raw = process.env.FACE_MATCH_THRESHOLD;
  const value = raw ? Number(raw) : 0.45;
  return Number.isFinite(value) ? value : 0.45;
}

export const EVENT_GAP_MS = 3 * 60 * 60 * 1000;
export const EVENT_MIN_PHOTOS = 3;
export const PERSON_MIN_PHOTOS = 2;
