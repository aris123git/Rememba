import { prisma } from "@/lib/prisma";

export async function timeline(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: [{ takenAt: "desc" }, { importedAt: "desc" }],
    select: {
      id: true,
      takenAt: true,
      importedAt: true,
      qualityScore: true,
      isBestInSeries: true,
      placeId: true,
    },
  });
  const buckets = new Map<string, { month: string; photoIds: string[]; count: number }>();
  for (const photo of photos) {
    const at = photo.takenAt ?? photo.importedAt;
    const month = at.toISOString().slice(0, 7);
    const bucket = buckets.get(month) ?? { month, photoIds: [], count: 0 };
    bucket.count += 1;
    if (bucket.photoIds.length < 12) bucket.photoIds.push(photo.id);
    buckets.set(month, bucket);
  }
  const memories = await prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return {
    months: [...buckets.values()].sort((a, b) => b.month.localeCompare(a.month)),
    memories: memories.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      occurredOn: item.occurredOn,
      payload: JSON.parse(item.payload) as Record<string, unknown>,
    })),
  };
}
