import { groupByTimeWindows, type TimedPhoto } from "./eventWindows";

export type RichPhoto = TimedPhoto & {
  placeId?: string | null;
  personIds?: string[];
};

export type RichEventWindow = {
  photoIds: string[];
  startsAt: Date;
  endsAt: Date;
  placeId: string | null;
  personIds: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  suggestedName: string;
};

function confidenceFor(window: {
  photoIds: string[];
  placeId: string | null;
  personIds: string[];
}): "LOW" | "MEDIUM" | "HIGH" {
  const n = window.photoIds.length;
  const people = window.personIds.length;
  if (window.placeId && people >= 2 && n >= 6) return "HIGH";
  if ((window.placeId && n >= 3) || n >= 8 || people >= 2) return "MEDIUM";
  return "LOW";
}

function suggestedName(window: RichEventWindow): string {
  const day = window.startsAt.toISOString().slice(0, 10);
  if (window.placeId && window.personIds.length) return `Souvenir du ${day}`;
  if (window.placeId) return `Moment au même lieu · ${day}`;
  return `Série du ${day}`;
}

export function groupRichEvents(
  photos: RichPhoto[],
  gapMs: number,
  minSize: number,
): RichEventWindow[] {
  const timeWindows = groupByTimeWindows(photos, gapMs, minSize);
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const results: RichEventWindow[] = [];

  for (const window of timeWindows) {
    const members = window.photoIds.map((id) => byId.get(id)).filter(Boolean) as RichPhoto[];
    const byPlace = new Map<string, string[]>();
    for (const photo of members) {
      const key = photo.placeId || "_none";
      const list = byPlace.get(key) ?? [];
      list.push(photo.id);
      byPlace.set(key, list);
    }
    const placeEntries = [...byPlace.entries()].filter(([, ids]) => ids.length >= minSize);
    const splits = placeEntries.length > 1 ? placeEntries : ([["_all", window.photoIds]] as [string, string[]][]);

    for (const [placeKey, ids] of splits) {
      const slice = ids.map((id) => byId.get(id)).filter(Boolean) as RichPhoto[];
      if (slice.length < minSize) continue;
      const personIds = [...new Set(slice.flatMap((photo) => photo.personIds ?? []))];
      const startsAt = slice.reduce(
        (min, photo) => (photo.at < min ? photo.at : min),
        slice[0].at,
      );
      const endsAt = slice.reduce(
        (max, photo) => (photo.at > max ? photo.at : max),
        slice[0].at,
      );
      const placeId = placeKey === "_none" || placeKey === "_all" ? slice[0]?.placeId ?? null : placeKey;
      const candidate: RichEventWindow = {
        photoIds: ids,
        startsAt,
        endsAt,
        placeId: placeId || null,
        personIds,
        confidence: "LOW",
        suggestedName: "",
      };
      candidate.confidence = confidenceFor(candidate);
      candidate.suggestedName = suggestedName(candidate);
      results.push(candidate);
    }
  }
  return results;
}
