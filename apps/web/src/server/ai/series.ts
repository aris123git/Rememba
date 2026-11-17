export const SERIES_GAP_MS = 8_000;

export type SeriesPhoto = { id: string; at: Date };

export type PhotoBurst = {
  photoIds: string[];
  capturedAt: Date;
};

export function groupBursts(photos: SeriesPhoto[], gapMs = SERIES_GAP_MS): PhotoBurst[] {
  const sorted = [...photos].sort((a, b) => a.at.getTime() - b.at.getTime());
  const bursts: SeriesPhoto[][] = [];
  let current: SeriesPhoto[] = [];
  for (const photo of sorted) {
    if (current.length === 0) {
      current = [photo];
      continue;
    }
    const last = current[current.length - 1];
    if (photo.at.getTime() - last.at.getTime() <= gapMs) {
      current.push(photo);
    } else {
      bursts.push(current);
      current = [photo];
    }
  }
  if (current.length) bursts.push(current);
  return bursts
    .filter((burst) => burst.length >= 2)
    .map((burst) => ({
      photoIds: burst.map((photo) => photo.id),
      capturedAt: burst[0].at,
    }));
}
