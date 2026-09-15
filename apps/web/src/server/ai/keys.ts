import { createHash } from "node:crypto";

export function photoSetKey(photoIds: string[]): string {
  const joined = [...photoIds].sort().join(",");
  return createHash("sha256").update(joined).digest("hex").slice(0, 32);
}

export function clusterDedupeKey(clusterId: string): string {
  return `person-cluster:${clusterId}`;
}

export function eventDedupeKey(photoIds: string[]): string {
  return `event-photos:${photoSetKey(photoIds)}`;
}
