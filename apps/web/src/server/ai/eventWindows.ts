export type TimedPhoto = { id: string; at: Date; alreadyInEvent?: boolean };

export type EventWindow = {
  photoIds: string[];
  startsAt: Date;
  endsAt: Date;
};

export function groupByTimeWindows(
  photos: TimedPhoto[],
  gapMs: number,
  minSize: number,
): EventWindow[] {
  const eligible = photos
    .filter((photo) => !photo.alreadyInEvent)
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const buckets: TimedPhoto[][] = [];
  let current: TimedPhoto[] = [];
  for (const photo of eligible) {
    if (current.length === 0) {
      current = [photo];
      continue;
    }
    const last = current[current.length - 1];
    if (photo.at.getTime() - last.at.getTime() <= gapMs) {
      current.push(photo);
    } else {
      buckets.push(current);
      current = [photo];
    }
  }
  if (current.length > 0) buckets.push(current);

  return buckets
    .filter((bucket) => bucket.length >= minSize)
    .map((bucket) => ({
      photoIds: bucket.map((photo) => photo.id),
      startsAt: bucket[0].at,
      endsAt: bucket[bucket.length - 1].at,
    }));
}
