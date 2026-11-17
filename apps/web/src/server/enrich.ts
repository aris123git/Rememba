import { EVENT_GAP_MS, EVENT_MIN_PHOTOS } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { faceMatchThreshold } from "@/lib/config";
import { groupRichEvents } from "@/server/ai/eventIntelligence";
import { clusterByDistance, defaultPlaceName, haversineKm } from "@/server/ai/geo";
import { qualityScore, pickBestPhotoId } from "@/server/ai/imageStats";
import { eventDedupeKey } from "@/server/ai/keys";
import { groupDuplicates } from "@/server/ai/phash";
import { groupBursts } from "@/server/ai/series";
import { bufferToFloat32, cosineSimilarity, meanNormalized } from "@/server/ai/vectors";
import { hasConsent } from "@/server/access";

export async function assignPlaces(userId: string) {
  const photos = await prisma.photo.findMany({
    where: {
      ownerId: userId,
      deletedAt: null,
      latitude: { not: null },
      longitude: { not: null },
    },
  });
  const points = photos
    .filter((photo) => photo.latitude != null && photo.longitude != null)
    .map((photo) => ({ id: photo.id, lat: photo.latitude as number, lng: photo.longitude as number }));
  if (points.length === 0) return;

  const existing = await prisma.place.findMany({ where: { ownerId: userId } });
  const clusters = clusterByDistance(points, 0.15);
  const used = new Set<string>();
  for (const cluster of clusters) {
    let place = existing.find(
      (item) => haversineKm(item.latitude, item.longitude, cluster.lat, cluster.lng) <= 0.15,
    );
    if (place) {
      await prisma.place.update({
        where: { id: place.id },
        data: { latitude: cluster.lat, longitude: cluster.lng },
      });
    } else {
      place = await prisma.place.create({
        data: {
          ownerId: userId,
          name: defaultPlaceName(cluster.lat, cluster.lng),
          latitude: cluster.lat,
          longitude: cluster.lng,
        },
      });
      existing.push(place);
    }
    used.add(place.id);
    await prisma.photo.updateMany({
      where: { id: { in: cluster.photoIds }, ownerId: userId },
      data: { placeId: place.id },
    });
  }
  await prisma.place.deleteMany({
    where: { ownerId: userId, id: { notIn: [...used] }, events: { none: {} }, photos: { none: {} } },
  });
}

export async function assignSeries(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, takenAt: true, importedAt: true },
  });
  await prisma.photo.updateMany({ where: { ownerId: userId }, data: { seriesId: null, isBestInSeries: false } });
  await prisma.photoSeries.deleteMany({ where: { ownerId: userId } });
  const bursts = groupBursts(
    photos.map((photo) => ({ id: photo.id, at: photo.takenAt ?? photo.importedAt })),
  );
  for (const burst of bursts) {
    const series = await prisma.photoSeries.create({
      data: { ownerId: userId, capturedAt: burst.capturedAt },
    });
    await prisma.photo.updateMany({
      where: { id: { in: burst.photoIds } },
      data: { seriesId: series.id },
    });
  }
}

export async function markDuplicates(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null, phash: { not: null } },
    select: { id: true, phash: true, qualityScore: true },
  });
  await prisma.photo.updateMany({ where: { ownerId: userId }, data: { duplicateOfId: null } });
  const groups = groupDuplicates(
    photos.map((photo) => ({ id: photo.id, phash: photo.phash as string })),
  );
  for (const group of groups) {
    const ranked = group
      .map((id) => photos.find((photo) => photo.id === id)!)
      .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    const keep = ranked[0];
    for (const extra of ranked.slice(1)) {
      await prisma.photo.update({
        where: { id: extra.id },
        data: { duplicateOfId: keep.id },
      });
    }
    await upsertRecommendation(userId, {
      type: "DUPLICATE_SET",
      dedupeKey: `dup:${[...group].sort().join(",")}`,
      confidence: group.length >= 3 ? "HIGH" : "MEDIUM",
      payload: { photoIds: group, keepId: keep.id, photoCount: group.length },
    });
  }
}

export async function scoreBestPhotos(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null },
    include: { faces: true },
  });
  for (const photo of photos) {
    const maxFace = photo.faces.reduce((m, face) => Math.max(m, face.score), 0);
    const score = qualityScore({
      sharpness: photo.sharpness ?? 0,
      width: photo.width,
      height: photo.height,
      maxFaceScore: maxFace,
      isDuplicate: Boolean(photo.duplicateOfId),
    });
    await prisma.photo.update({ where: { id: photo.id }, data: { qualityScore: score } });
  }

  const series = await prisma.photoSeries.findMany({
    where: { ownerId: userId },
    include: { photos: { where: { deletedAt: null } } },
  });
  for (const item of series) {
    const bestId = pickBestPhotoId(
      item.photos.map((photo) => ({ id: photo.id, qualityScore: photo.qualityScore ?? 0 })),
    );
    await prisma.photo.updateMany({ where: { seriesId: item.id }, data: { isBestInSeries: false } });
    if (bestId) {
      await prisma.photo.update({ where: { id: bestId }, data: { isBestInSeries: true } });
      await prisma.photoSeries.update({ where: { id: item.id }, data: { bestPhotoId: bestId } });
      await upsertRecommendation(userId, {
        type: "BEST_SHOT",
        dedupeKey: `best:${item.id}`,
        confidence: "MEDIUM",
        payload: {
          seriesId: item.id,
          bestPhotoId: bestId,
          photoIds: item.photos.map((photo) => photo.id),
          photoCount: item.photos.length,
        },
      });
    }
  }
}

export async function generateRichEventSuggestions(userId: string) {
  const photos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null },
    include: {
      eventPhotos: { include: { event: true } },
      faces: { include: { cluster: true } },
    },
  });
  const rich = photos.map((photo) => ({
    id: photo.id,
    at: photo.takenAt ?? photo.importedAt,
    alreadyInEvent: photo.eventPhotos.some((link) => link.event.status === "CONFIRMED"),
    placeId: photo.placeId,
    personIds: photo.faces
      .map((face) => face.cluster?.personId)
      .filter((id): id is string => Boolean(id)),
  }));
  const windows = groupRichEvents(rich, EVENT_GAP_MS, EVENT_MIN_PHOTOS);
  for (const window of windows) {
    await upsertRecommendation(userId, {
      type: "EVENT_CANDIDATE",
      dedupeKey: eventDedupeKey(window.photoIds),
      confidence: window.confidence,
      payload: {
        photoIds: window.photoIds,
        startsAt: window.startsAt.toISOString(),
        endsAt: window.endsAt.toISOString(),
        photoCount: window.photoIds.length,
        placeId: window.placeId,
        personIds: window.personIds,
        suggestedName: window.suggestedName,
      },
    });
  }
}

export async function generateShareSuggestions(userId: string) {
  if (!(await hasConsent(userId, "COLLECTIVE_MATCHING"))) return;
  const threshold = faceMatchThreshold();
  const myPhotos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null },
    include: {
      faces: true,
    },
  });
  const others = await prisma.consent.findMany({
    where: { type: "COLLECTIVE_MATCHING", granted: true, userId: { not: userId } },
    include: {
      user: {
        include: {
          people: {
            where: { isUserSelf: true },
            include: { clusters: { include: { faces: true } } },
          },
        },
      },
    },
  });

  const galleries = others
    .map((row) => {
      const self = row.user.people[0];
      const faces = self?.clusters.flatMap((cluster) => cluster.faces) ?? [];
      if (faces.length === 0) return null;
      return {
        userId: row.user.id,
        displayName: row.user.displayName,
        centroid: meanNormalized(faces.map((face) => bufferToFloat32(face.embedding))),
      };
    })
    .filter(Boolean) as { userId: string; displayName: string; centroid: Float32Array }[];

  for (const photo of myPhotos) {
    for (const face of photo.faces) {
      const vector = bufferToFloat32(face.embedding);
      for (const gallery of galleries) {
        const sim = cosineSimilarity(vector, gallery.centroid);
        if (sim < threshold) continue;
        const existing = await prisma.photoShareSuggestion.findFirst({
          where: { ownerId: userId, photoId: photo.id, suggestedUserId: gallery.userId },
        });
        if (existing) continue;
        await prisma.photoShareSuggestion.create({
          data: {
            ownerId: userId,
            photoId: photo.id,
            suggestedUserId: gallery.userId,
            reason: `${gallery.displayName} pourrait apparaître sur cette photo (similarité ${sim.toFixed(2)}). Suggestion uniquement.`,
            status: "PENDING",
          },
        });
        await upsertRecommendation(userId, {
          type: "SHARE_PHOTO",
          dedupeKey: `share:${photo.id}:${gallery.userId}`,
          confidence: sim >= 0.6 ? "HIGH" : "MEDIUM",
          payload: {
            photoId: photo.id,
            photoIds: [photo.id],
            suggestedUserId: gallery.userId,
            displayName: gallery.displayName,
            similarity: sim,
          },
        });
      }
    }
  }
}

export async function generateMemories(userId: string) {
  const now = new Date();
  const photos = await prisma.photo.findMany({
    where: { ownerId: userId, deletedAt: null, takenAt: { not: null } },
    orderBy: { takenAt: "desc" },
  });
  const sameDay = photos.filter((photo) => {
    const taken = photo.takenAt!;
    return taken.getUTCMonth() === now.getUTCMonth() && taken.getUTCDate() === now.getUTCDate() && taken.getUTCFullYear() < now.getUTCFullYear();
  });
  if (sameDay.length > 0) {
    const years = [...new Set(sameDay.map((photo) => photo.takenAt!.getUTCFullYear()))];
    const dedupeKey = `onthisday:${now.toISOString().slice(5, 10)}`;
    await prisma.memory.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {
        title: `Un jour comme aujourd’hui`,
        payload: JSON.stringify({
          photoIds: sameDay.slice(0, 24).map((photo) => photo.id),
          years,
        }),
        occurredOn: now,
      },
      create: {
        userId,
        kind: "ON_THIS_DAY",
        title: `Un jour comme aujourd’hui`,
        dedupeKey,
        occurredOn: now,
        payload: JSON.stringify({
          photoIds: sameDay.slice(0, 24).map((photo) => photo.id),
          years,
        }),
      },
    });
    await upsertRecommendation(userId, {
      type: "MEMORY_ON_THIS_DAY",
      dedupeKey,
      confidence: sameDay.length >= 4 ? "HIGH" : "MEDIUM",
      payload: {
        photoIds: sameDay.slice(0, 12).map((photo) => photo.id),
        photoCount: sameDay.length,
        years,
      },
    });
  }

  const byMonth = new Map<string, typeof photos>();
  for (const photo of photos) {
    const key = photo.takenAt!.toISOString().slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(photo);
    byMonth.set(key, list);
  }
  for (const [month, list] of byMonth) {
    if (list.length < 5) continue;
    const dedupeKey = `month:${month}`;
    await prisma.memory.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      update: {
        payload: JSON.stringify({ photoIds: list.slice(0, 30).map((photo) => photo.id), photoCount: list.length }),
      },
      create: {
        userId,
        kind: "MONTH_RECAP",
        title: `Souvenirs de ${month}`,
        dedupeKey,
        occurredOn: list[0].takenAt,
        payload: JSON.stringify({ photoIds: list.slice(0, 30).map((photo) => photo.id), photoCount: list.length }),
      },
    });
  }
}

export async function enrichLibraryJob(userId: string) {
  await assignPlaces(userId);
  await assignSeries(userId);
  await markDuplicates(userId);
  await scoreBestPhotos(userId);
  await generateRichEventSuggestions(userId);
  await generateShareSuggestions(userId);
  await generateMemories(userId);
}

async function upsertRecommendation(
  userId: string,
  input: {
    type: string;
    dedupeKey: string;
    confidence: string;
    payload: Record<string, unknown>;
  },
) {
  const existing = await prisma.aIRecommendation.findUnique({
    where: { userId_dedupeKey: { userId, dedupeKey: input.dedupeKey } },
  });
  if (existing && existing.status !== "PENDING" && existing.status !== "SNOOZED") return;
  await prisma.aIRecommendation.upsert({
    where: { userId_dedupeKey: { userId, dedupeKey: input.dedupeKey } },
    update: {
      payload: JSON.stringify(input.payload),
      confidence: input.confidence,
    },
    create: {
      userId,
      type: input.type,
      dedupeKey: input.dedupeKey,
      confidence: input.confidence,
      payload: JSON.stringify(input.payload),
    },
  });
}
